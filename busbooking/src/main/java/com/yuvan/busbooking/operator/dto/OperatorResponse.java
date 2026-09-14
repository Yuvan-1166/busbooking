package com.yuvan.busbooking.operator.dto;

import com.yuvan.busbooking.operator.entity.OperatorStatus;

import java.time.LocalDateTime;

public record OperatorResponse(
        Long id,
        Long userId,
        String name,
        String registrationNumber,
        String contactEmail,
        String contactPhone,
        OperatorStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}