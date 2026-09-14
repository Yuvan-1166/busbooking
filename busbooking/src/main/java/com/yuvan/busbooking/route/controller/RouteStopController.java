package com.yuvan.busbooking.route.controller;

import com.yuvan.busbooking.route.dto.RouteStopRequest;
import com.yuvan.busbooking.route.dto.RouteStopResponse;
import com.yuvan.busbooking.route.service.RouteStopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/route-stops")
public class RouteStopController {

    private final RouteStopService routeStopService;

    public RouteStopController(RouteStopService routeStopService) {
        this.routeStopService = routeStopService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<RouteStopResponse> create(
            @Valid @RequestBody RouteStopRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(routeStopService.create(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RouteStopResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                routeStopService.findById(id)
        );
    }

    @GetMapping("/route/{routeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RouteStopResponse>> findByRoute(
            @PathVariable Long routeId
    ) {
        return ResponseEntity.ok(
                routeStopService.findByRoute(routeId)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<RouteStopResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RouteStopRequest request
    ) {
        return ResponseEntity.ok(
                routeStopService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        routeStopService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}