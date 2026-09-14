package com.yuvan.busbooking.booking.controller;

import com.yuvan.busbooking.booking.dto.SeatHoldRequest;
import com.yuvan.busbooking.booking.dto.SeatHoldResponse;
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
    
}