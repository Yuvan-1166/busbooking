package com.yuvan.busbooking.booking.dto;

import java.math.BigDecimal;

public record CancellationUpdateRequest(
        String reason,
        BigDecimal refundAmount
) {
}