package com.yuvan.busbooking.trip.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record BulkTripRequest(
        @NotNull
        Long scheduleId,

        @NotEmpty
        List<LocalDate> tripDates
) {
}
