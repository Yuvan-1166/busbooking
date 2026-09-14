package com.yuvan.busbooking.booking.dto;

import jakarta.validation.constraints.Size;

public record BookingCancellationRequest(

        @Size(max = 500)
        String reason

) {}