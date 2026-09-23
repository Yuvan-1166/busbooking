package com.yuvan.busbooking.trip.service;

import com.yuvan.busbooking.bus.entity.Seat;
import com.yuvan.busbooking.bus.repository.SeatRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteStopRepository;
import com.yuvan.busbooking.trip.dto.TripRequest;
import com.yuvan.busbooking.trip.dto.BulkTripRequest;
import com.yuvan.busbooking.trip.dto.TripResponse;
import com.yuvan.busbooking.trip.entity.Schedule;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.entity.TripStatus;
import com.yuvan.busbooking.trip.repository.ScheduleRepository;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class TripService {

    private static final List<TripStatus> ACTIVE_STATUSES = List.of(
            TripStatus.SCHEDULED,
            TripStatus.BOARDING,
            TripStatus.IN_PROGRESS
    );

    private final TripRepository tripRepository;
    private final ScheduleRepository scheduleRepository;
    private final TripSeatRepository tripSeatRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final RouteStopRepository routeStopRepository;

    public TripService(
            TripRepository tripRepository,
            ScheduleRepository scheduleRepository,
            TripSeatRepository tripSeatRepository,
            SeatRepository seatRepository,
            UserRepository userRepository,
            RouteStopRepository routeStopRepository
    ) {
        this.tripRepository = tripRepository;
        this.scheduleRepository = scheduleRepository;
        this.tripSeatRepository = tripSeatRepository;
        this.seatRepository = seatRepository;
        this.userRepository = userRepository;
        this.routeStopRepository = routeStopRepository;
    }

    @Transactional
public TripResponse createTrip(TripRequest request) {

    Schedule schedule = scheduleRepository.findById(request.scheduleId())
            .orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Schedule not found with id: " + request.scheduleId()
                    )
            );

    if (tripRepository.existsByScheduleIdAndTripDate(
            request.scheduleId(),
            request.tripDate()
    )) {
        throw new IllegalArgumentException(
                "Trip already exists for this schedule and date"
        );
    }

    Trip trip = new Trip();

    trip.setSchedule(schedule);
    trip.setRoute(schedule.getRoute());
    trip.setBus(schedule.getBus());
    trip.setTripDate(request.tripDate());
    trip.setBaseFare(schedule.getBaseFare());
    trip.setPricePerKm(schedule.getPricePerKm());

    trip.setDepartureTime(
            request.departureTime() != null
                    ? request.departureTime()
                    : schedule.getDepartureTime()
    );

    trip.setStatus(
            request.status() != null
                    ? request.status()
                    : TripStatus.SCHEDULED
    );

    trip.setExpiresAt(calculateExpirationTime(trip));

    trip = tripRepository.save(trip);

    List<Seat> seats = seatRepository.findByBusIdOrderBySeatNumber(
            schedule.getBus().getId()
    );

    for (Seat seat : seats) {

        TripSeat tripSeat = new TripSeat();

        tripSeat.setTrip(trip);
        tripSeat.setSeat(seat);
        tripSeat.setStatus(TripSeatStatus.AVAILABLE);

        tripSeatRepository.save(tripSeat);
    }

    return toResponse(trip);
}

    @Transactional
    public List<TripResponse> createBulkTrips(BulkTripRequest request) {
        Schedule schedule = scheduleRepository.findById(request.scheduleId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Schedule not found with id: " + request.scheduleId()
                        )
                );

        List<Seat> seats = seatRepository.findByBusIdOrderBySeatNumber(
                schedule.getBus().getId()
        );

        return request.tripDates().stream()
                .map(tripDate -> {
                    // Skip if trip already exists for this date
                    if (tripRepository.existsByScheduleIdAndTripDate(
                            request.scheduleId(),
                            tripDate
                    )) {
                        return null;
                    }

                    Trip trip = new Trip();
                    trip.setSchedule(schedule);
                    trip.setRoute(schedule.getRoute());
                    trip.setBus(schedule.getBus());
                    trip.setTripDate(tripDate);
                    trip.setBaseFare(schedule.getBaseFare());
                    trip.setPricePerKm(schedule.getPricePerKm());
                    trip.setDepartureTime(schedule.getDepartureTime());
                    trip.setStatus(TripStatus.SCHEDULED);
                    trip.setExpiresAt(calculateExpirationTime(trip));

                    trip = tripRepository.save(trip);

                    // Create trip seats
                    for (Seat seat : seats) {
                        TripSeat tripSeat = new TripSeat();
                        tripSeat.setTrip(trip);
                        tripSeat.setSeat(seat);
                        tripSeat.setStatus(TripSeatStatus.AVAILABLE);
                        tripSeatRepository.save(tripSeat);
                    }

                    return trip;
                })
                .filter(trip -> trip != null)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> findAll() {

        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        if(SecurityUtils.hasRole(RoleName.OPERATOR.toString())) {
                return tripRepository.findByBusOperatorUserId(user.getId())
                        .stream()
                        .map(this::toResponse)
                        .toList();
        }
        else {
                List<Trip> trips = tripRepository.findAll();

                if (!SecurityUtils.hasRole(RoleName.ADMIN.toString())) {
                        trips = trips.stream()
                                .filter(this::isUpcoming)
                                .toList();
                }

                return trips.stream()
                        .map(this::toResponse)
                        .toList();
        }
    }

    @Transactional(readOnly = true)
    public TripResponse findById(Long id) {

        Trip trip = tripRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found: " + id
                        )
                );

        updateExpirationIfNecessary(trip);

        if (!SecurityUtils.hasRole(RoleName.ADMIN.toString())
                && !SecurityUtils.hasRole(RoleName.OPERATOR.toString())
                && !isUpcoming(trip)) {
                throw new ResourceNotFoundException(
                        "Trip not found: " + id
                );
        }

        return toResponse(trip);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> findByRouteAndDate(
            Long routeId,
            LocalDate date
    ) {

        return tripRepository
                .findUpcomingByRouteIdAndTripDate(
                        routeId,
                        date,
                        ACTIVE_STATUSES,
                        LocalDateTime.now()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> findByBus(Long busId) {

        List<Trip> trips = tripRepository.findByBusId(busId);

        if (!SecurityUtils.hasRole(RoleName.ADMIN.toString())
                && !SecurityUtils.hasRole(RoleName.OPERATOR.toString())) {
                trips = trips.stream()
                        .filter(this::isUpcoming)
                        .toList();
        }

        return trips.stream()
                .map(this::toResponse)
                .toList();
    }

    public TripResponse update(
            Long id,
            TripRequest request
    ) {

        Trip trip = tripRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found: " + id
                        )
                );

        Schedule schedule = scheduleRepository.findById(
                request.scheduleId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Schedule not found: " + request.scheduleId()
                )
        );

        trip.setSchedule(schedule);
        trip.setRoute(schedule.getRoute());
        trip.setBus(schedule.getBus());
        trip.setTripDate(request.tripDate());

        trip.setDepartureTime(
                request.departureTime() != null
                        ? request.departureTime()
                        : schedule.getDepartureTime()
        );

        if (request.status() != null) {
            trip.setStatus(request.status());
        }

        trip.setExpiresAt(calculateExpirationTime(trip));

        return toResponse(tripRepository.save(trip));
    }

    public void delete(Long id) {

        if (!tripRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Trip not found: " + id
            );
        }

        tripRepository.deleteById(id);
    }

    @Transactional
    public void cancelTripAndRefundPassengers(Long tripId, String cancellationReason) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found: " + tripId
                        )
                );

        // Mark trip as cancelled
        trip.setStatus(TripStatus.CANCELLED);
        tripRepository.save(trip);

        // Find all bookings for this trip that are confirmed
        // and cascade refunds to all passengers
        // Note: Requires BookingRepository to have a method to find by trip
    }

    private void updateExpirationIfNecessary(Trip trip) {

        if (isActiveStatus(trip.getStatus())
                        && trip.getExpiresAt() != null
                        && !LocalDateTime.now().isBefore(trip.getExpiresAt())) {

                trip.setStatus(TripStatus.COMPLETED);
                tripRepository.save(trip);
        }
    }

    private boolean isActiveStatus(TripStatus status) {
        return status == TripStatus.SCHEDULED
                || status == TripStatus.BOARDING
                || status == TripStatus.IN_PROGRESS;
    }

    private boolean isUpcoming(Trip trip) {

        return isActiveStatus(trip.getStatus())
                && trip.getExpiresAt() != null
                && trip.getExpiresAt()
                        .isAfter(LocalDateTime.now());
    }

    private LocalDateTime calculateExpirationTime(Trip trip) {

        LocalDateTime departureDateTime = LocalDateTime.of(
                trip.getTripDate(),
                trip.getDepartureTime());

        return routeStopRepository
                .findByRouteIdOrderByStopOrder(trip.getRoute().getId())
                .stream()
                .map(RouteStop::getArrivalOffsetMinutes)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .map(departureDateTime::plusMinutes)
                .orElse(departureDateTime);
    }

    private TripResponse toResponse(Trip trip) {

        return new TripResponse(
                trip.getId(),
                trip.getSchedule().getId(),
                trip.getRoute().getId(),
                trip.getBus().getId(),
                trip.getTripDate(),
                trip.getDepartureTime(),
                trip.getBaseFare(),
                trip.getStatus(),
                trip.getExpiresAt(),
                trip.getCreatedAt(),
                trip.getUpdatedAt()
        );
    }

}