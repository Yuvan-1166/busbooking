package com.yuvan.busbooking.bus.controller;

import com.yuvan.busbooking.bus.dto.SeatRequest;
import com.yuvan.busbooking.bus.dto.SeatResponse;
import com.yuvan.busbooking.bus.service.SeatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seats")
@PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @PostMapping
    public ResponseEntity<SeatResponse> create(
            @Valid @RequestBody SeatRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(seatService.create(request));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<SeatResponse>> createBatch(
            @Valid @RequestBody List<SeatRequest> requests
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(seatService.createBatch(requests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeatResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                seatService.findById(id)
        );
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<SeatResponse>> findByBus(
            @PathVariable Long busId
    ) {
        return ResponseEntity.ok(
                seatService.findByBus(busId)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<SeatResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SeatRequest request
    ) {
        return ResponseEntity.ok(
                seatService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        seatService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}