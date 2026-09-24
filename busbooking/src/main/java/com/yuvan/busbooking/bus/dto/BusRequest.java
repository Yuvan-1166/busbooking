package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusStatus;
import com.yuvan.busbooking.bus.entity.BusType;
import com.yuvan.busbooking.bus.entity.DeckType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BusRequest(

        @NotBlank
        @Size(max = 50)
        @Pattern(
                regexp = "^(?:[A-Za-z]{2}[\\s-]?[0-9]{1,2}[\\s-]?[A-Za-z]{1,3}[\\s-]?[0-9]{4}|[0-9]{2}[\\s-]?BH[\\s-]?[0-9]{4}[\\s-]?[A-Za-z]{1,2})$",
                message = "must follow the Indian RTO format (e.g., KA 01 AB 1234)"
        )
        String registrationNumber,

        @NotBlank
        @Size(max = 150)
        String model,

        @NotNull
        BusType busType,

        @NotNull
        DeckType deckType,

        BusStatus status
) {
}