package com.yuvan.busbooking.bus.controller;

import com.yuvan.busbooking.bus.dto.BusRequest;
import com.yuvan.busbooking.bus.dto.BusResponse;
import com.yuvan.busbooking.bus.service.BusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/buses")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<BusResponse> create(
            @Valid @RequestBody BusRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(busService.create(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BusResponse>> findAll() {
        return ResponseEntity.ok(busService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BusResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                busService.findById(id)
        );
    }

    @GetMapping("/operator/{operatorId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BusResponse>> findByOperator(
            @PathVariable Long operatorId
    ) {
        return ResponseEntity.ok(
                busService.findByOperator(operatorId)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<BusResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BusRequest request
    ) {
        return ResponseEntity.ok(
                busService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        busService.delete(id);

        return ResponseEntity.noContent().build();
    }
    
}