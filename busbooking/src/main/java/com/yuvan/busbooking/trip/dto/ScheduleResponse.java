package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.trip.entity.ScheduleStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public record ScheduleResponse(
        Long id,
        Long routeId,
        Long busId,
        LocalTime departureTime,
        LocalDate effectiveFrom,
        LocalDate effectiveUntil,
        String operatingDays,
        BigDecimal baseFare,
        BigDecimal pricePerKm,
        ScheduleStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}