package com.yuvan.busbooking.route.dto;

import com.yuvan.busbooking.route.entity.RouteStatus;

import java.time.LocalDateTime;

public record RouteResponse(
        Long id,
        String name,
        RouteStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}