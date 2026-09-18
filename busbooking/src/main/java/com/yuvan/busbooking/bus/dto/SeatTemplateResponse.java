package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusTemplateType;
import com.yuvan.busbooking.bus.entity.DeckType;
import com.yuvan.busbooking.bus.entity.SeatTemplate;

public record SeatTemplateResponse(
        Long id,
        String name,
        BusTemplateType templateType,
        String templateTypeDisplay,
        DeckType deckType,
        Integer totalSeats,
        String description,
        SeatTemplate.TemplateConfiguration configuration,
        Boolean isActive
) {
    public static SeatTemplateResponse fromEntity(SeatTemplate template) {
        return new SeatTemplateResponse(
                template.getId(),
                template.getName(),
                template.getTemplateType(),
                template.getTemplateType().getDisplayName(),
                template.getDeckType(),
                template.getTotalSeats(),
                template.getDescription(),
                template.getConfiguration(),
                template.getIsActive()
        );
    }
}
