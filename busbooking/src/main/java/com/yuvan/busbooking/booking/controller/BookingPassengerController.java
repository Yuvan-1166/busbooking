package com.yuvan.busbooking.booking.controller;

import com.yuvan.busbooking.booking.dto.BookingPassengerCreateRequest;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.booking.service.BookingPassengerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/booking-passengers")
@PreAuthorize("hasRole('ADMIN')")
public class BookingPassengerController {

    private final BookingPassengerService bookingPassengerService;

    public BookingPassengerController(BookingPassengerService bookingPassengerService) {
        this.bookingPassengerService = bookingPassengerService;
    }

    @GetMapping
    public ResponseEntity<List<BookingPassengerResponse>> findAll() {
        return ResponseEntity.ok(
                bookingPassengerService.findAll()
        );
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<BookingPassengerResponse>> findByBooking(
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(
                bookingPassengerService.findByBooking(bookingId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingPassengerResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                bookingPassengerService.findById(id)
        );
    }

    @PostMapping
    public ResponseEntity<BookingPassengerResponse> create(
            @Valid @RequestBody BookingPassengerCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingPassengerService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingPassengerResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BookingPassengerCreateRequest request
    ) {
        return ResponseEntity.ok(
                bookingPassengerService.update(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        bookingPassengerService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
}