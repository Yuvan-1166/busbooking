package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.Cancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CancellationRepository
        extends JpaRepository<Cancellation, Long> {

    Optional<Cancellation> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    @Query("""
                SELECT c
                FROM Cancellation c
                WHERE c.booking.createdAt BETWEEN :from AND :to
                ORDER BY c.cancelledAt
            """)
    List<Cancellation> findForAnalytics(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
                SELECT c
                FROM Cancellation c
                WHERE c.booking.createdAt BETWEEN :from AND :to
                  AND c.booking.trip.bus.operator.id = :operatorId
                ORDER BY c.cancelledAt
            """)
    List<Cancellation> findForAnalyticsByOperator(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("operatorId") Long operatorId);
}