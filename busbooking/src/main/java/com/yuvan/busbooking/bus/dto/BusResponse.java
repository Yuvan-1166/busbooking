package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusStatus;
import com.yuvan.busbooking.bus.entity.BusType;
import com.yuvan.busbooking.bus.entity.DeckType;

import java.time.LocalDateTime;

public record BusResponse(
        Long id,
        Long operatorId,
        String registrationNumber,
        String model,
        BusType busType,
        DeckType deckType,
        BusStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}