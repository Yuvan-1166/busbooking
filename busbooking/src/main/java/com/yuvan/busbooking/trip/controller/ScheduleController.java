package com.yuvan.busbooking.trip.controller;

import com.yuvan.busbooking.trip.dto.ScheduleRequest;
import com.yuvan.busbooking.trip.dto.ScheduleResponse;
import com.yuvan.busbooking.trip.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ScheduleResponse> create(
            @Valid @RequestBody ScheduleRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(scheduleService.create(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ScheduleResponse>> findAll() {
        return ResponseEntity.ok(scheduleService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ScheduleResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                scheduleService.findById(id)
        );
    }

    @GetMapping("/route/{routeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ScheduleResponse>> findByRoute(
            @PathVariable Long routeId
    ) {
        return ResponseEntity.ok(
                scheduleService.findByRoute(routeId)
        );
    }

    @GetMapping("/bus/{busId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ScheduleResponse>> findByBus(
            @PathVariable Long busId
    ) {
        return ResponseEntity.ok(
                scheduleService.findByBus(busId)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ScheduleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request
    ) {
        return ResponseEntity.ok(
                scheduleService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        scheduleService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}