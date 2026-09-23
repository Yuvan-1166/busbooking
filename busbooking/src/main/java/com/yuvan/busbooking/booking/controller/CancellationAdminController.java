package com.yuvan.busbooking.booking.controller;

import com.yuvan.busbooking.booking.dto.CancellationResponse;
import com.yuvan.busbooking.booking.dto.CancellationUpdateRequest;
import com.yuvan.busbooking.booking.service.CancellationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cancellations")
public class CancellationAdminController {

    private final CancellationService cancellationService;

    public CancellationAdminController(CancellationService cancellationService) {
        this.cancellationService = cancellationService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CancellationResponse>> findAll() {
        return ResponseEntity.ok(
                cancellationService.findAll()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                cancellationService.findById(id)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CancellationUpdateRequest request
    ) {
        return ResponseEntity.ok(
                cancellationService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        cancellationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}