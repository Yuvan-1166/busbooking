package com.yuvan.busbooking.route.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.location.entity.Location;
import com.yuvan.busbooking.location.repository.LocationRepository;
import com.yuvan.busbooking.route.dto.RouteStopRequest;
import com.yuvan.busbooking.route.dto.RouteStopResponse;
import com.yuvan.busbooking.route.entity.Route;
import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteRepository;
import com.yuvan.busbooking.route.repository.RouteStopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RouteStopService {

    private final RouteStopRepository routeStopRepository;
    private final RouteRepository routeRepository;
    private final LocationRepository locationRepository;

    public RouteStopService(
            RouteStopRepository routeStopRepository,
            RouteRepository routeRepository,
            LocationRepository locationRepository
    ) {
        this.routeStopRepository = routeStopRepository;
        this.routeRepository = routeRepository;
        this.locationRepository = locationRepository;
    }

    public RouteStopResponse create(RouteStopRequest request) {

        Route route = routeRepository.findById(request.routeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + request.routeId()
                        )
                );

        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Location not found: " + request.locationId()
                        )
                );

        RouteStop routeStop = new RouteStop();

        routeStop.setRoute(route);
        routeStop.setLocation(location);
        routeStop.setStopOrder(request.stopOrder());
        routeStop.setArrivalOffsetMinutes(
                request.arrivalOffsetMinutes()
        );
        routeStop.setDepartureOffsetMinutes(
                request.departureOffsetMinutes()
        );
        routeStop.setDistanceFromOriginKm(request.distanceFromOriginKm());

        return toResponse(routeStopRepository.save(routeStop));
    }

    @Transactional(readOnly = true)
    public List<RouteStopResponse> findAll() {

        return routeStopRepository
                .findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RouteStopResponse> findByRoute(Long routeId) {

        if (!routeRepository.existsById(routeId)) {
            throw new ResourceNotFoundException(
                    "Route not found: " + routeId
            );
        }

        return routeStopRepository
                .findByRouteIdOrderByStopOrder(routeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteStopResponse findById(Long id) {

        RouteStop routeStop = routeStopRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route stop not found: " + id
                        )
                );

        return toResponse(routeStop);
    }

    public RouteStopResponse update(
            Long id,
            RouteStopRequest request
    ) {

        RouteStop routeStop = routeStopRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route stop not found: " + id
                        )
                );

        Route route = routeRepository.findById(request.routeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + request.routeId()
                        )
                );

        Location location = locationRepository.findById(request.locationId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Location not found: " + request.locationId()
                        )
                );

        routeStop.setRoute(route);
        routeStop.setLocation(location);
        routeStop.setStopOrder(request.stopOrder());
        routeStop.setArrivalOffsetMinutes(
                request.arrivalOffsetMinutes()
        );
        routeStop.setDepartureOffsetMinutes(
                request.departureOffsetMinutes()
        );

        return toResponse(routeStopRepository.save(routeStop));
    }

    public void delete(Long id) {

        if (!routeStopRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Route stop not found: " + id
            );
        }

        routeStopRepository.deleteById(id);
    }

    private RouteStopResponse toResponse(RouteStop routeStop) {

        return new RouteStopResponse(
                routeStop.getId(),
                routeStop.getRoute().getId(),
                routeStop.getLocation().getId(),
                routeStop.getStopOrder(),
                routeStop.getArrivalOffsetMinutes(),
                routeStop.getDepartureOffsetMinutes(),
                routeStop.getDistanceFromOriginKm(),
                routeStop.getCreatedAt(),
                routeStop.getUpdatedAt()
        );
    }
    
}