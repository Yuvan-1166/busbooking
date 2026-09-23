package com.yuvan.busbooking.ticket.controller;

import java.util.*;
import com.yuvan.busbooking.ticket.dto.TicketResponse;
import com.yuvan.busbooking.ticket.dto.TicketUpdateRequest;
import com.yuvan.busbooking.ticket.service.TicketService;

import java.nio.file.AccessDeniedException;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<TicketResponse> generateTicket(
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(
                ticketService.generateTicket(bookingId)
        );
    }

    @GetMapping("/booking")
    @PreAuthorize("hasAnyRole('ADMIN', 'PASSENGER')")
    public ResponseEntity<List<TicketResponse>> getTicketsByUsers() {

        return ResponseEntity.ok(
                ticketService.findTicketsByUser()
        );

    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PASSENGER')")
    public ResponseEntity<TicketResponse> getTicketByBookingId(
            @PathVariable Long bookingId
    ) throws AccessDeniedException {
        return ResponseEntity.ok(
                ticketService.getTicketByBookingId(bookingId)
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TicketResponse>> findAll() {

        return ResponseEntity.ok(
                ticketService.findAll()
        );
    }

    @GetMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ticketService.findById(id)
        );
    }

    @PutMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateRequest request
    ) {
        return ResponseEntity.ok(
                ticketService.updateStatus(id, request)
        );
    }

    @DeleteMapping("/id/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id
    ) {
        ticketService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{ticketNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PASSENGER')")
    public ResponseEntity<TicketResponse> getTicketByNumber(
            @PathVariable String ticketNumber
    ) throws AccessDeniedException {
        return ResponseEntity.ok(
                ticketService.getTicketByNumber(ticketNumber)
        );
    }
}