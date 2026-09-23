package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import jakarta.validation.constraints.NotNull;

public record TripSeatRequest(

        @NotNull(message = "Trip id is required")
        Long tripId,

        @NotNull(message = "Seat id is required")
        Long seatId,

        TripSeatStatus status
) {
}