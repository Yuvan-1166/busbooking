package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.trip.entity.TripStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record TripRequest(

        @NotNull
        Long scheduleId,

        @NotNull
        LocalDate tripDate,

        LocalTime departureTime,

        TripStatus status
) {
}