package com.yuvan.busbooking.trip.controller;

import com.yuvan.busbooking.trip.dto.TripRequest;
import com.yuvan.busbooking.trip.dto.TripResponse;
import com.yuvan.busbooking.trip.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<TripResponse> create(
            @Valid @RequestBody TripRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(tripService.createTrip(request));
    }

    @GetMapping
    public ResponseEntity<List<TripResponse>> findAll() {
        return ResponseEntity.ok(
                tripService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                tripService.findById(id)
        );
    }

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<TripResponse>> findByRouteAndDate(
            @PathVariable Long routeId,
            @RequestParam LocalDate date
    ) {
        return ResponseEntity.ok(
                tripService.findByRouteAndDate(routeId, date)
        );
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<TripResponse>> findByBus(
            @PathVariable Long busId
    ) {
        return ResponseEntity.ok(
                tripService.findByBus(busId)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<TripResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TripRequest request
    ) {
        return ResponseEntity.ok(
                tripService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        tripService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}