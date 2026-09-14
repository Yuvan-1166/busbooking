package com.yuvan.busbooking.trip.repository;

import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TripSeatRepository extends JpaRepository<TripSeat, Long> {

    List<TripSeat> findByTripId(Long tripId);

    List<TripSeat> findByTripIdAndStatus(
            Long tripId,
            TripSeatStatus status
    );

    Optional<TripSeat> findByTripIdAndSeatId(
            Long tripId,
            Long seatId
    );

    boolean existsByTripIdAndSeatId(
            Long tripId,
            Long seatId
    );

    Optional<TripSeat> findByIdAndTripId(
            Long id, Long tripId
    );
    
}