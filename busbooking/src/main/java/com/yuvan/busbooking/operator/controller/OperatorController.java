package com.yuvan.busbooking.operator.controller;

import com.yuvan.busbooking.operator.dto.OperatorRequest;
import com.yuvan.busbooking.operator.dto.OperatorResponse;
import com.yuvan.busbooking.operator.service.OperatorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operators")
public class OperatorController {

    private final OperatorService operatorService;

    public OperatorController(OperatorService operatorService) {
        this.operatorService = operatorService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OperatorResponse> create(
            @Valid @RequestBody OperatorRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(operatorService.create(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OperatorResponse>> findAll() {
        return ResponseEntity.ok(operatorService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperatorResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(operatorService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OperatorResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody OperatorRequest request
    ) {
        return ResponseEntity.ok(
                operatorService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        operatorService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}