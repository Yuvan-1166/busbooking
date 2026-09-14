package com.yuvan.busbooking.trip.repository;

import com.yuvan.busbooking.trip.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {

    boolean existsByScheduleIdAndTripDate(
            Long scheduleId,
            LocalDate tripDate
    );

    List<Trip> findByRouteIdAndTripDate(
            Long routeId,
            LocalDate tripDate
    );

    List<Trip> findByBusId(Long busId);

    List<Trip> findByBusOperatorUserId(Long userId);
    
}