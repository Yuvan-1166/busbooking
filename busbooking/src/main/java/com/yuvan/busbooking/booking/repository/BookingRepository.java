package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByUserId(Long userId);

    List<Booking> findByTripId(Long tripId);

    List<Booking> findByUserIdAndStatus(
            Long userId,
            BookingStatus status
    );

    boolean existsByBookingReference(String bookingReference);
    
}