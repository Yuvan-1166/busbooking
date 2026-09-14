package com.yuvan.busbooking.booking.dto;

import java.util.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record BookingRequest(
    @NotNull 
    Long tripId,

    @NotNull(message = "Pickup location is required")
    Long pickupLocationId,

    @NotNull(message = "Drop location is required")
    Long dropLocationId,

    @NotEmpty 
    @Size(max = 10)
    @Valid 
    List<BookingPassengerRequest> passengers
) {
}