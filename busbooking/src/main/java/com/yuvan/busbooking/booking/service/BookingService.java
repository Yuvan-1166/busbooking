package com.yuvan.busbooking.booking.service;

import com.yuvan.busbooking.booking.dto.BookingPassengerRequest;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.booking.dto.BookingRequest;
import com.yuvan.busbooking.booking.dto.BookingResponse;
import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingPassenger;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.entity.Gender;
import com.yuvan.busbooking.booking.entity.SeatHold;
import com.yuvan.busbooking.booking.entity.SeatHoldStatus;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.booking.repository.SeatHoldRepository;
import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteStopRepository;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingPassengerRepository bookingPassengerRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final RouteStopRepository routeStopRepository;
    private final PricingService pricingService;
    private final SeatHoldRepository seatHoldRepository;

    public BookingService(
            BookingRepository bookingRepository,
            BookingPassengerRepository bookingPassengerRepository,
            UserRepository userRepository,
            TripRepository tripRepository,
            RouteStopRepository routeStopRepository,
            PricingService pricingService,
            SeatHoldRepository seatHoldRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.routeStopRepository = routeStopRepository;
        this.pricingService = pricingService;
        this.seatHoldRepository = seatHoldRepository;
    }

        @Transactional
        public BookingResponse createBooking(
                Long userId,
                BookingRequest request
        ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found with id: " + request.tripId()
                        )
                );
        
        RouteStop pickupStop = routeStopRepository
                .findByRouteIdAndLocationId(
                        trip.getRoute().getId(),
                        request.pickupLocationId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pickup location is not a stop on this route"
                        )
                );

        RouteStop dropStop = routeStopRepository
                .findByRouteIdAndLocationId(
                        trip.getRoute().getId(),
                        request.dropLocationId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Drop location is not a stop on this route"
                        )
                );

        if (pickupStop.getStopOrder() >= dropStop.getStopOrder()) {
        throw new IllegalArgumentException(
                "Drop location must come after pickup location"
        );
        }

        BigDecimal totalAmount = pricingService.calculateFare(
                trip,
                pickupStop.getDistanceFromOriginKm(),
                dropStop.getDistanceFromOriginKm(),
                request.passengers().size()
        );      

        validateDuplicateSeats(request);

        LocalDateTime now = LocalDateTime.now();

        Booking booking = new Booking();

        booking.setUser(user);
        booking.setTrip(trip);
        booking.setBookingReference(generateBookingReference());

        booking.setStatus(BookingStatus.PAYMENT_PENDING);

        booking.setPickupLocation(pickupStop.getLocation());
        booking.setDropLocation(dropStop.getLocation());

        booking.setTotalAmount(totalAmount);

        booking = bookingRepository.save(booking);

        for (BookingPassengerRequest passengerRequest :
                request.passengers()) {

                SeatHold hold = seatHoldRepository
                        .findByTripSeatIdAndUserIdAndStatus(
                                passengerRequest.tripSeatId(),
                                userId,
                                SeatHoldStatus.ACTIVE
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "No active hold found for trip seat: "
                                                + passengerRequest.tripSeatId()
                                )
                        );

                validateHold(hold, trip, now);

                TripSeat tripSeat = hold.getTripSeat();

                // Safety-net: re-enforce gender policy at booking time
                enforceGenderPolicy(tripSeat, passengerRequest.gender());

                BookingPassenger passenger = new BookingPassenger();

                passenger.setBooking(booking);
                passenger.setSeatHold(hold);
                passenger.setTripSeat(tripSeat);
                passenger.setFirstName(passengerRequest.firstName());
                passenger.setLastName(passengerRequest.lastName());
                passenger.setAge(passengerRequest.age());
                passenger.setGender(passengerRequest.gender());

                bookingPassengerRepository.save(passenger);
        }

                return toResponse(booking);
        }

        public List<BookingResponse> findAll() {
                List<BookingResponse> bookings = bookingRepository.findAll()
                                                        .stream()
                                                        .map(this::toResponse)
                                                        .toList();
                return bookings;
        }

    /**
     * Safety-net gender policy check at booking time.
     * The primary enforcement happens at hold time; this guards against
     * any race or bypass where a hold was created without policy validation.
     */
    private void enforceGenderPolicy(TripSeat tripSeat, Gender passengerGender) {
        SeatGenderPolicy policy = tripSeat.getSeat().getGenderPolicy();

        if (policy == null || policy == SeatGenderPolicy.ANY
                || policy == SeatGenderPolicy.FEMALE_PREFERRED
                || policy == SeatGenderPolicy.MALE_PREFERRED) {
            return;
        }

        String seatNumber = tripSeat.getSeat().getSeatNumber();

        if (policy == SeatGenderPolicy.FEMALE_ONLY && passengerGender != Gender.FEMALE) {
            throw new IllegalArgumentException(
                    "Seat " + seatNumber + " is reserved for female passengers only"
            );
        }

        if (policy == SeatGenderPolicy.MALE_ONLY && passengerGender != Gender.MALE) {
            throw new IllegalArgumentException(
                    "Seat " + seatNumber + " is reserved for male passengers only"
            );
        }
    }

    private void validateDuplicateSeats(BookingRequest request) {

        Set<Long> seatIds = new HashSet<>();

        for (BookingPassengerRequest passenger :
                request.passengers()) {

            if (!seatIds.add(passenger.tripSeatId())) {
                throw new IllegalArgumentException(
                        "The same trip seat cannot be selected more than once"
                );
            }
        }
    }

        private void validateHold(
                SeatHold hold,
                Trip trip,
                LocalDateTime now
        ) {

        TripSeat tripSeat = hold.getTripSeat();

        if (!tripSeat.getTrip().getId().equals(trip.getId())) {
                throw new IllegalArgumentException(
                        "Trip seat does not belong to this trip"
                );
        }

        if (hold.getExpiresAt().isBefore(now)) {

                hold.setStatus(SeatHoldStatus.EXPIRED);

                tripSeat.setStatus(TripSeatStatus.AVAILABLE);
                tripSeat.setHeldUntil(null);

                throw new IllegalArgumentException(
                        "Seat hold has expired"
                );
        }

        if (tripSeat.getStatus() != TripSeatStatus.HELD) {
                throw new IllegalArgumentException(
                        "Trip seat is no longer held"
                );
        }
        }

    private String generateBookingReference() {

        return "BUS-" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Booking not found: " + bookingId)
                );
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("This booking does not belong to you");
        }
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse updateBooking(Long bookingId, BookingRequest request) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + bookingId
                        )
                );

        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found with id: " + request.tripId()
                        )
                );
        
        RouteStop pickupStop = routeStopRepository
                .findByRouteIdAndLocationId(
                        trip.getRoute().getId(),
                        request.pickupLocationId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pickup location is not a stop on this route"
                        )
                );

        RouteStop dropStop = routeStopRepository
                .findByRouteIdAndLocationId(
                        trip.getRoute().getId(),
                        request.dropLocationId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Drop location is not a stop on this route"
                        )
                );

        if (pickupStop.getStopOrder() >= dropStop.getStopOrder()) {
        throw new IllegalArgumentException(
                "Drop location must come after pickup location"
        );
        }

        BigDecimal totalAmount = pricingService.calculateFare(
                trip,
                pickupStop.getDistanceFromOriginKm(),
                dropStop.getDistanceFromOriginKm(),
                request.passengers().size()
        );      

        validateDuplicateSeats(request);

        booking.setTrip(trip);
        booking.setPickupLocation(pickupStop.getLocation());
        booking.setDropLocation(dropStop.getLocation());
        booking.setTotalAmount(totalAmount);

        return toResponse(bookingRepository.save(booking));
    }

    public void deleteBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "Booking not found: " + bookingId
                                        )
                                );
        bookingRepository.deleteById(booking.getId());
    }

    private BookingResponse toResponse(Booking booking) {

        List<BookingPassengerResponse> passengers =
                bookingPassengerRepository
                        .findByBookingId(booking.getId())
                        .stream()
                        .map(passenger ->
                                new BookingPassengerResponse(
                                        passenger.getId(),
                                        passenger.getTripSeat().getId(),
                                        passenger.getTripSeat()
                                                .getSeat()
                                                .getSeatNumber(),
                                        passenger.getFirstName(),
                                        passenger.getLastName(),
                                        passenger.getAge(),
                                        passenger.getGender()
                                )
                        )
                        .toList();

        return new BookingResponse(
                booking.getId(),
                booking.getBookingReference(),
                booking.getUser().getId(),
                booking.getTrip().getId(),
                booking.getStatus(),
                booking.getTotalAmount(),
                booking.getPickupLocation().getId(),
                booking.getDropLocation().getId(),
                passengers,
                booking.getCreatedAt(),
                booking.getUpdatedAt()
                );
        }
    
}