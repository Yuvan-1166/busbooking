package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusStatus;
import com.yuvan.busbooking.bus.entity.BusType;
import com.yuvan.busbooking.bus.entity.DeckType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BusRequest(

        @NotBlank
        @Size(max = 50)
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