package com.yuvan.busbooking.booking.controller;

import com.yuvan.busbooking.booking.dto.BookingRequest;
import com.yuvan.busbooking.booking.dto.BookingResponse;
import com.yuvan.busbooking.booking.service.BookingService;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;

import java.util.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;

    public BookingController(BookingService bookingService, UserService userService) {
        this.bookingService = bookingService;
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request
    ) {

        String email = SecurityUtils.getCurrentUserEmail();

        User user = userService.findByEmail(email);

        BookingResponse response =
                bookingService.createBooking(user.getId(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping()
    @PreAuthorize("hasrole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getBookings() {
        return ResponseEntity.ok(
                bookingService.findAll()
        );
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable Long bookingId
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(
                bookingService.getBooking(user.getId(), bookingId)
        );
    }
    
}