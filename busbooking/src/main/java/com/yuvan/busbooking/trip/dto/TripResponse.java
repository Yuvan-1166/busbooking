package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.trip.entity.TripStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record TripResponse(
        Long id,
        Long scheduleId,
        Long routeId,
        Long busId,
        LocalDate tripDate,
        LocalTime departureTime,
        BigDecimal startingFare,
        TripStatus status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}