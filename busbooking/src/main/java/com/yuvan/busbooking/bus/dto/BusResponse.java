package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.BusStatus;
import com.yuvan.busbooking.bus.entity.BusType;

import java.time.LocalDateTime;

public record BusResponse(
        Long id,
        Long operatorId,
        String registrationNumber,
        String model,
        BusType busType,
        BusStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}