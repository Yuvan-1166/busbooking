package com.yuvan.busbooking.route.repository;

import com.yuvan.busbooking.route.entity.RouteStop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteStopRepository
        extends JpaRepository<RouteStop, Long> {

    List<RouteStop> findByRouteIdOrderByStopOrder(Long routeId);

    Optional<RouteStop> findByRouteIdAndLocationId(Long id,
            Long dropLocationId);

    long countByRouteId(Long routeId);

    void deleteByRouteId(Long routeId);
}