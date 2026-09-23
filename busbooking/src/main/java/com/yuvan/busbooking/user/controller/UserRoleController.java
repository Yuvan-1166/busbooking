package com.yuvan.busbooking.user.controller;

import com.yuvan.busbooking.user.dto.UserRoleRequest;
import com.yuvan.busbooking.user.dto.UserRoleResponse;
import com.yuvan.busbooking.user.service.UserRoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user-roles")
@PreAuthorize("hasRole('ADMIN')")
public class UserRoleController {

    private final UserRoleService userRoleService;

    public UserRoleController(UserRoleService userRoleService) {
        this.userRoleService = userRoleService;
    }

    @GetMapping
    public ResponseEntity<List<UserRoleResponse>> findAll() {
        return ResponseEntity.ok(
                userRoleService.findAll()
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserRoleResponse>> findByUser(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                userRoleService.findByUser(userId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserRoleResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                userRoleService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<UserRoleResponse> create(
            @Valid @RequestBody UserRoleRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userRoleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserRoleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleRequest request
    ) {
        return ResponseEntity.ok(
                userRoleService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        userRoleService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}