package com.yuvan.busbooking.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SeatHoldRequest(

        @NotNull(message = "Trip ID is required")
        Long tripId,

        @NotEmpty(message = "At least one seat is required")
        @Size(max = 10, message = "Cannot hold more than 10 seats")
        List<@NotNull @Valid SeatHoldItem> seats

) {}
