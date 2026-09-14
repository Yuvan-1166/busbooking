package com.yuvan.busbooking.route.controller;

import com.yuvan.busbooking.route.dto.RouteRequest;
import com.yuvan.busbooking.route.dto.RouteResponse;
import com.yuvan.busbooking.route.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<RouteResponse> create(
            @Valid @RequestBody RouteRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(routeService.create(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RouteResponse>> findAll() {
        return ResponseEntity.ok(routeService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RouteResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                routeService.findById(id)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<RouteResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RouteRequest request
    ) {
        return ResponseEntity.ok(
                routeService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        routeService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}