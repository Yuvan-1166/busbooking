package com.yuvan.busbooking.route.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.geo.GeoDistanceCalculator;
import com.yuvan.busbooking.location.entity.Location;
import com.yuvan.busbooking.location.repository.LocationRepository;
import com.yuvan.busbooking.route.dto.RouteRequest;
import com.yuvan.busbooking.route.dto.RouteResponse;
import com.yuvan.busbooking.route.entity.Route;
import com.yuvan.busbooking.route.entity.RouteStatus;
import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteRepository;
import com.yuvan.busbooking.route.repository.RouteStopRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class RouteService {

    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final LocationRepository locationRepository;

    public RouteService(
            RouteRepository routeRepository,
            RouteStopRepository routeStopRepository,
            LocationRepository locationRepository
    ) {
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
        this.locationRepository = locationRepository;
    }

    public RouteResponse create(RouteRequest request) {

        Route route = new Route();

        route.setName(request.name());

        route.setStatus(
                request.status() != null
                        ? request.status()
                        : RouteStatus.ACTIVE
        );

        Route saved = routeRepository.save(route);

        replaceStops(saved, request.stops());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> findAll() {

        return routeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteResponse findById(Long id) {

        Route route = routeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + id
                        )
                );

        return toResponse(route);
    }

    public RouteResponse update(
            Long id,
            RouteRequest request
    ) {

        Route route = routeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + id
                        )
                );

        route.setName(request.name());

        if (request.status() != null) {
            route.setStatus(request.status());
        }

        if (request.stops() != null) {
            replaceStops(route, request.stops());
        }

        return toResponse(routeRepository.save(route));
    }

    public void delete(Long id) {

        if (!routeRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Route not found: " + id
            );
        }

        try {
            routeStopRepository.deleteByRouteId(id);
            routeRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Cannot delete route that is used by existing schedules or trips."
            );
        }
    }

    /**
     * Deletes existing stops and rebuilds them from the supplied ordered list.
     * Distances from the origin are derived from stop coordinates (haversine)
     * whenever a caller does not provide them explicitly.
     */
    private void replaceStops(
            Route route,
            List<RouteRequest.RouteStopItem> stopItems
    ) {
        routeStopRepository.deleteByRouteId(route.getId());

        if (stopItems == null || stopItems.isEmpty()) {
            return;
        }

        List<Location> orderedLocations = new ArrayList<>();

        for (RouteRequest.RouteStopItem item : stopItems) {
            Location location = locationRepository.findById(item.locationId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Location not found: " + item.locationId()
                            )
                    );
            orderedLocations.add(location);
        }

        BigDecimal distanceFromOrigin = BigDecimal.ZERO;

        for (int i = 0; i < stopItems.size(); i++) {
            RouteRequest.RouteStopItem item = stopItems.get(i);

            RouteStop stop = new RouteStop();
            stop.setRoute(route);
            stop.setLocation(orderedLocations.get(i));
            stop.setStopOrder(i + 1);
            stop.setArrivalOffsetMinutes(item.arrivalOffsetMinutes());
            stop.setDepartureOffsetMinutes(item.departureOffsetMinutes());

            if (i == 0) {
                distanceFromOrigin = BigDecimal.ZERO;
            } else if (item.distanceFromOriginKm() != null) {
                distanceFromOrigin = item.distanceFromOriginKm();
            } else {
                double segmentKm = GeoDistanceCalculator.haversineKm(
                        orderedLocations.get(i - 1),
                        orderedLocations.get(i)
                );
                distanceFromOrigin = distanceFromOrigin
                        .add(BigDecimal.valueOf(segmentKm));
            }

            stop.setDistanceFromOriginKm(distanceFromOrigin);
            routeStopRepository.save(stop);
        }
    }

    private RouteResponse toResponse(Route route) {

        List<RouteStop> stops = routeStopRepository
                .findByRouteIdOrderByStopOrder(route.getId());

        int stopCount = stops.size();

        BigDecimal totalDistanceKm = stops.isEmpty()
                ? BigDecimal.ZERO
                : stops.get(stops.size() - 1).getDistanceFromOriginKm();

        return new RouteResponse(
                route.getId(),
                route.getName(),
                route.getStatus(),
                stopCount,
                totalDistanceKm,
                route.getCreatedAt(),
                route.getUpdatedAt()
        );
    }

}