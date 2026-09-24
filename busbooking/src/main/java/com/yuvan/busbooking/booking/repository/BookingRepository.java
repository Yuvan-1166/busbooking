package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    List<Booking> findByTripIdAndStatus(
            Long tripId,
            BookingStatus status
    );

    boolean existsByBookingReference(String bookingReference);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.createdAt BETWEEN :from AND :to
                ORDER BY b.createdAt
            """)
    List<Booking> findForAnalytics(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.createdAt BETWEEN :from AND :to
                  AND b.trip.bus.operator.id = :operatorId
                ORDER BY b.createdAt
            """)
    List<Booking> findForAnalyticsByOperator(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("operatorId") Long operatorId);
}