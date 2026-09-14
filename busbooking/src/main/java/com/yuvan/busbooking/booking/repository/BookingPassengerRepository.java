package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.BookingPassenger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingPassengerRepository
        extends JpaRepository<BookingPassenger, Long> {

    List<BookingPassenger> findByBookingId(Long bookingId);

    boolean existsByTripSeatId(Long tripSeatId);
    
}