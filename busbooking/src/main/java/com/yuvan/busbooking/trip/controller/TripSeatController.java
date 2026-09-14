package com.yuvan.busbooking.trip.controller;

import com.yuvan.busbooking.trip.dto.TripSeatResponse;
import com.yuvan.busbooking.trip.service.TripSeatService;
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
    
}