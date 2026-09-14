package com.yuvan.busbooking.booking.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.yuvan.busbooking.booking.dto.BookingCancellationRequest;
import com.yuvan.busbooking.booking.dto.CancellationResponse;
import com.yuvan.busbooking.booking.service.CancellationService;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/bookings")
public class CancellationController {

    private final CancellationService cancellationService;
    private final UserService userService;

    public CancellationController(CancellationService cancellationService, UserService userService) {
        this.cancellationService = cancellationService;
        this.userService = userService;
    }
    
    @PostMapping("/{bookingId}/cancel")
    @PreAuthorize("hasRole('PASSENGER')")
    public CancellationResponse cancelBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingCancellationRequest request
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userService.findByEmail(email);
        return cancellationService.cancelBooking(
                bookingId,
                user.getId(),
                request
        );
    }

}
