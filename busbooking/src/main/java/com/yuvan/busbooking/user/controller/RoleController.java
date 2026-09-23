package com.yuvan.busbooking.user.controller;

import com.yuvan.busbooking.user.dto.RoleRequest;
import com.yuvan.busbooking.user.dto.RoleResponse;
import com.yuvan.busbooking.user.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ResponseEntity<List<RoleResponse>> findAll() {
        return ResponseEntity.ok(
                roleService.findAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                roleService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<RoleResponse> create(
            @Valid @RequestBody RoleRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(roleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request
    ) {
        return ResponseEntity.ok(
                roleService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}