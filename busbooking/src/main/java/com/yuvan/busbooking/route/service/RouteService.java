package com.yuvan.busbooking.route.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.route.dto.RouteRequest;
import com.yuvan.busbooking.route.dto.RouteResponse;
import com.yuvan.busbooking.route.entity.Route;
import com.yuvan.busbooking.route.entity.RouteStatus;
import com.yuvan.busbooking.route.repository.RouteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RouteService {

    private final RouteRepository routeRepository;

    public RouteService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    public RouteResponse create(RouteRequest request) {

        Route route = new Route();

        route.setName(request.name());

        route.setStatus(
                request.status() != null
                        ? request.status()
                        : RouteStatus.ACTIVE
        );

        return toResponse(routeRepository.save(route));
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

        return toResponse(routeRepository.save(route));
    }

    public void delete(Long id) {

        if (!routeRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Route not found: " + id
            );
        }

        routeRepository.deleteById(id);
    }

    private RouteResponse toResponse(Route route) {

        return new RouteResponse(
                route.getId(),
                route.getName(),
                route.getStatus(),
                route.getCreatedAt(),
                route.getUpdatedAt()
        );
    }
    
}