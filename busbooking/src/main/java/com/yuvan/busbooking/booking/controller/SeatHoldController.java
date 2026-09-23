package com.yuvan.busbooking.booking.controller;

import com.yuvan.busbooking.booking.dto.SeatHoldRequest;
import com.yuvan.busbooking.booking.dto.SeatHoldResponse;
import com.yuvan.busbooking.booking.dto.SeatHoldUpdateRequest;
import com.yuvan.busbooking.booking.service.SeatHoldService;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seat-holds")
public class SeatHoldController {

    private final SeatHoldService seatHoldService;
    private final UserService userService;

    public SeatHoldController(SeatHoldService seatHoldService, UserService userService) {
        this.seatHoldService = seatHoldService;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<List<SeatHoldResponse>> holdSeats(
            @Valid @RequestBody SeatHoldRequest request
    ) {

        String email = SecurityUtils.getCurrentUserEmail();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(
                seatHoldService.holdSeats(user.getId(), request)
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SeatHoldResponse>> findAll() {
        return ResponseEntity.ok(
                seatHoldService.findAll()
        );
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<List<SeatHoldResponse>> getMyHolds() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(
                seatHoldService.findByUser(user.getId())
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeatHoldResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(
                seatHoldService.findById(id)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeatHoldResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SeatHoldUpdateRequest request
    ) {
        return ResponseEntity.ok(
                seatHoldService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PASSENGER')")
    public ResponseEntity<Void> releaseHold(@PathVariable Long id) {

        String email = SecurityUtils.getCurrentUserEmail();
        User user = userService.findByEmail(email);

        Long userId = SecurityUtils.hasRole("ADMIN")
                ? null
                : user.getId();

        seatHoldService.release(id, userId);

        return ResponseEntity.noContent().build();
    }
    
}