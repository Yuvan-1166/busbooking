package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.Gender;
import jakarta.validation.constraints.*;

public record BookingPassengerCreateRequest(

        @NotNull(message = "Booking id is required")
        Long bookingId,

        @NotNull(message = "Trip seat id is required")
        Long tripSeatId,

        @NotBlank(message = "First name is required")
        @Size(max = 100)
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100)
        String lastName,

        @NotNull(message = "Age is required")
        @Min(1)
        @Max(120)
        Integer age,

        @NotNull(message = "Gender is required")
        Gender gender,

        Long seatHoldId
) {
}