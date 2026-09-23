package com.yuvan.busbooking.trip.controller;

import com.yuvan.busbooking.trip.dto.TripSeatRequest;
import com.yuvan.busbooking.trip.dto.TripSeatResponse;
import com.yuvan.busbooking.trip.service.TripSeatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trip-seats")
@PreAuthorize("isAuthenticated()")
public class TripSeatController {

    private final TripSeatService tripSeatService;

    public TripSeatController(TripSeatService tripSeatService) {
        this.tripSeatService = tripSeatService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TripSeatResponse>> findAll() {
        return ResponseEntity.ok(
                tripSeatService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripSeatResponse> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                tripSeatService.getTripSeat(id)
        );
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<TripSeatResponse>> getByTrip(
            @PathVariable Long tripId
    ) {
        return ResponseEntity.ok(
                tripSeatService.getSeatsByTrip(tripId)
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TripSeatResponse> create(
            @Valid @RequestBody TripSeatRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(tripSeatService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TripSeatResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TripSeatRequest request
    ) {
        return ResponseEntity.ok(
                tripSeatService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        tripSeatService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}