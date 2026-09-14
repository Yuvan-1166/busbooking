package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingReference,
        Long userId,
        Long tripId,
        BookingStatus status,
        BigDecimal totalAmount,
        Long pickupLocationId,
        Long dropLocationId,
        List<BookingPassengerResponse> passengers,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}