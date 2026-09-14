package com.yuvan.busbooking.booking.repository;

import com.yuvan.busbooking.booking.entity.SeatHold;
import com.yuvan.busbooking.booking.entity.SeatHoldStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SeatHoldRepository extends JpaRepository<SeatHold, Long> {

    List<SeatHold> findByUserId(Long userId);

    List<SeatHold> findByTripSeatId(Long tripSeatId);

    Optional<SeatHold> findByTripSeatIdAndStatus(
            Long tripSeatId,
            SeatHoldStatus status
    );

    List<SeatHold> findByStatus(SeatHoldStatus status);

    @Query("""
        SELECT h
        FROM SeatHold h
        WHERE h.status = :status
        AND h.expiresAt <= :now
    """)
    List<SeatHold> findExpiredHolds(
            SeatHoldStatus status,
            LocalDateTime now
    );

    Optional<SeatHold> findByTripSeatIdAndUserIdAndStatus(
        Long tripSeatId,
        Long userId,
        SeatHoldStatus status
    );

}