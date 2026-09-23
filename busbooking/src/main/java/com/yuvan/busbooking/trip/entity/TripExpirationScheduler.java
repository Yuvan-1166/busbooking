package com.yuvan.busbooking.trip.entity;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteStopRepository;
import com.yuvan.busbooking.trip.repository.TripRepository;

import jakarta.transaction.Transactional;

@Component
public class TripExpirationScheduler {

    private static final List<TripStatus> ACTIVE_STATUSES = List.of(
            TripStatus.SCHEDULED,
            TripStatus.BOARDING,
            TripStatus.IN_PROGRESS
    );

    private final TripRepository tripRepository;
    private final RouteStopRepository routeStopRepository;

    public TripExpirationScheduler(
            TripRepository tripRepository,
            RouteStopRepository routeStopRepository
    ) {
        this.tripRepository = tripRepository;
        this.routeStopRepository = routeStopRepository;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expireTrips() {

        LocalDateTime now = LocalDateTime.now();

        List<Trip> withoutExpiration =
                tripRepository.findActiveTripsWithoutExpiration(
                        ACTIVE_STATUSES
                );

        withoutExpiration.forEach(trip ->
                trip.setExpiresAt(calculateExpirationTime(trip))
        );

        tripRepository.saveAll(withoutExpiration);

        List<Trip> trips =
                tripRepository.findTripsToExpire(
                        ACTIVE_STATUSES,
                        now
                );

        trips.forEach(trip ->
                trip.setStatus(TripStatus.COMPLETED)
        );

        tripRepository.saveAll(trips);
    }

    private LocalDateTime calculateExpirationTime(Trip trip) {

        LocalDateTime departureDateTime = LocalDateTime.of(
                trip.getTripDate(),
                trip.getDepartureTime());

        return routeStopRepository
                .findByRouteIdOrderByStopOrder(trip.getRoute().getId())
                .stream()
                .map(RouteStop::getArrivalOffsetMinutes)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .map(departureDateTime::plusMinutes)
                .orElse(departureDateTime);
    }
}
