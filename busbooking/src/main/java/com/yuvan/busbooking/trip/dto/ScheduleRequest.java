package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.trip.entity.ScheduleStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleRequest(

        @NotNull
        Long routeId,

        @NotNull
        Long busId,

        @NotNull
        LocalTime departureTime,

        @NotNull
        LocalDate effectiveFrom,

        LocalDate effectiveUntil,

        @NotBlank
        @Size(max = 27)
        String operatingDays,

        @NotNull @DecimalMin(value = "0.0")
        BigDecimal baseFare,

        @NotNull @DecimalMin(value = "0.0")
        BigDecimal pricePerKm,
        
        ScheduleStatus status
) {
}