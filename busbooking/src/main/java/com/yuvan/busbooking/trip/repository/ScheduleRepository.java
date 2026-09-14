package com.yuvan.busbooking.trip.repository;

import com.yuvan.busbooking.trip.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository
        extends JpaRepository<Schedule, Long> {

    List<Schedule> findByRouteId(Long routeId);

    List<Schedule> findByBusId(Long busId);

    List<Schedule> findByBusOperatorUserId(Long userId);
    
}