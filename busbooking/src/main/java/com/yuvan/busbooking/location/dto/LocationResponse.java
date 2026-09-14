package com.yuvan.busbooking.location.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LocationResponse(
        Long id,
        String name,
        String city,
        String state,
        String country,
        BigDecimal latitude,
        BigDecimal longitude,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}