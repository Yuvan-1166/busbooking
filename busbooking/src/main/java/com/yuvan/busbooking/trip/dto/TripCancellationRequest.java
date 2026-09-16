package com.yuvan.busbooking.trip.dto;

import jakarta.validation.constraints.NotBlank;

public record TripCancellationRequest(
        @NotBlank(message = "Cancellation reason is required")
        String reason
) {
}
