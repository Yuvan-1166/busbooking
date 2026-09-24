package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.BookingPassenger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface BookingPassengerRepository
        extends JpaRepository<BookingPassenger, Long> {

    List<BookingPassenger> findByBookingId(Long bookingId);

    List<BookingPassenger> findByBookingIdIn(
            Collection<Long> bookingIds);

    boolean existsByTripSeatId(Long tripSeatId);
    
}