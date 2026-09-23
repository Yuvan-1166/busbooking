package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusTemplateType;
import com.yuvan.busbooking.bus.entity.DeckType;
import com.yuvan.busbooking.bus.entity.SeatTemplate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SeatTemplateRequest(

        @NotBlank(message = "Name is required")
        String name,

        @NotNull(message = "Template type is required")
        BusTemplateType templateType,

        @NotNull(message = "Deck type is required")
        DeckType deckType,

        @NotNull(message = "Total seats is required")
        Integer totalSeats,

        String description,

        Boolean isActive,

        @NotNull(message = "Configuration is required")
        SeatTemplate.TemplateConfiguration configuration
) {
}