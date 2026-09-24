package com.yuvan.busbooking.ticket.dto;

import com.yuvan.busbooking.bus.entity.BusType;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.ticket.entity.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record TicketResponse(

        Long id,

        Long bookingId,

        String ticketNumber,

        String bookingReference,

        Long userId,

        Long tripId,

        String routeName,

        LocalDate tripDate,

        LocalTime departureTime,

        Long pickupLocationId,

        String pickupLocationName,

        Long dropLocationId,

        String dropLocationName,

        Long busId,

        String busModel,

        String busRegistrationNumber,

        BusType busType,

        String operatorName,

        BigDecimal totalAmount,

        List<BookingPassengerResponse> passengers,

        LocalDateTime issuedAt,

        LocalDateTime expiresAt,

        TicketStatus ticketStatus,

        String cancellationReason

) {}