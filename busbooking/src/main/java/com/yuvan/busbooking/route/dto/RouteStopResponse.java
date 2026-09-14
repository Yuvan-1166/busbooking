package com.yuvan.busbooking.route.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RouteStopResponse(
        Long id,
        Long routeId,
        Long locationId,
        Integer stopOrder,
        Integer arrivalOffsetMinutes,
        Integer departureOffsetMinutes,
        BigDecimal distanceFromOriginKm,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}