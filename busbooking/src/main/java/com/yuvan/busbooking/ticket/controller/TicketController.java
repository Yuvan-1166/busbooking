package com.yuvan.busbooking.ticket.controller;

import java.util.*;
import com.yuvan.busbooking.ticket.dto.TicketResponse;
import com.yuvan.busbooking.ticket.service.TicketService;

import java.nio.file.AccessDeniedException;

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