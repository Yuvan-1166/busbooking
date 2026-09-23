package com.yuvan.busbooking.booking.service;

import com.yuvan.busbooking.booking.dto.BookingPassengerCreateRequest;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingPassenger;
import com.yuvan.busbooking.booking.entity.SeatHold;
import com.yuvan.busbooking.booking.entity.SeatHoldStatus;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.booking.repository.SeatHoldRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BookingPassengerService {

    private final BookingPassengerRepository bookingPassengerRepository;
    private final BookingRepository bookingRepository;
    private final TripSeatRepository tripSeatRepository;
    private final SeatHoldRepository seatHoldRepository;

    public BookingPassengerService(
            BookingPassengerRepository bookingPassengerRepository,
            BookingRepository bookingRepository,
            TripSeatRepository tripSeatRepository,
            SeatHoldRepository seatHoldRepository
    ) {
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.bookingRepository = bookingRepository;
        this.tripSeatRepository = tripSeatRepository;
        this.seatHoldRepository = seatHoldRepository;
    }

    @Transactional(readOnly = true)
    public List<BookingPassengerResponse> findAll() {
        return bookingPassengerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingPassengerResponse> findByBooking(Long bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResourceNotFoundException(
                    "Booking not found: " + bookingId
            );
        }

        return bookingPassengerRepository.findByBookingId(bookingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingPassengerResponse findById(Long id) {
        BookingPassenger passenger = bookingPassengerRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking passenger not found: " + id
                        )
                );
        return toResponse(passenger);
    }

    public BookingPassengerResponse create(BookingPassengerCreateRequest request) {

        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + request.bookingId()
                        )
                );

        TripSeat tripSeat = tripSeatRepository.findById(request.tripSeatId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found: " + request.tripSeatId()
                        )
                );

        BookingPassenger passenger = new BookingPassenger();

        passenger.setBooking(booking);
        passenger.setTripSeat(tripSeat);
        passenger.setSeatHold(resolveHold(request));
        passenger.setFirstName(request.firstName());
        passenger.setLastName(request.lastName());
        passenger.setAge(request.age());
        passenger.setGender(request.gender());

        return toResponse(bookingPassengerRepository.save(passenger));
    }

    public BookingPassengerResponse update(
            Long id,
            BookingPassengerCreateRequest request
    ) {

        BookingPassenger passenger = bookingPassengerRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking passenger not found: " + id
                        )
                );

        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + request.bookingId()
                        )
                );

        TripSeat tripSeat = tripSeatRepository.findById(request.tripSeatId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found: " + request.tripSeatId()
                        )
                );

        passenger.setBooking(booking);
        passenger.setTripSeat(tripSeat);
        passenger.setSeatHold(resolveHold(request));
        passenger.setFirstName(request.firstName());
        passenger.setLastName(request.lastName());
        passenger.setAge(request.age());
        passenger.setGender(request.gender());

        return toResponse(bookingPassengerRepository.save(passenger));
    }

    public void delete(Long id) {
        if (!bookingPassengerRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Booking passenger not found: " + id
            );
        }
        bookingPassengerRepository.deleteById(id);
    }

    private SeatHold resolveHold(BookingPassengerCreateRequest request) {
        if (request.seatHoldId() != null) {
            return seatHoldRepository.findById(request.seatHoldId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Seat hold not found: " + request.seatHoldId()
                            )
                    );
        }

        return seatHoldRepository
                .findByTripSeatIdAndStatus(
                        request.tripSeatId(),
                        SeatHoldStatus.ACTIVE
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No active seat hold found for trip seat: "
                                        + request.tripSeatId()
                        )
                );
    }

    private BookingPassengerResponse toResponse(BookingPassenger passenger) {
        TripSeat tripSeat = passenger.getTripSeat();

        return new BookingPassengerResponse(
                passenger.getId(),
                tripSeat.getId(),
                tripSeat.getSeat().getSeatNumber(),
                passenger.getFirstName(),
                passenger.getLastName(),
                passenger.getAge(),
                passenger.getGender()
        );
    }
}