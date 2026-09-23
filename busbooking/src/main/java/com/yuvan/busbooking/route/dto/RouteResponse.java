package com.yuvan.busbooking.route.dto;

import com.yuvan.busbooking.route.entity.RouteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RouteResponse(
        Long id,
        String name,
        RouteStatus status,
        int stopCount,
        BigDecimal totalDistanceKm,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}