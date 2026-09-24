package com.yuvan.busbooking.analytics.dto;

import java.math.BigDecimal;

/**
 * Performance snapshot for a single operator (admin dashboard only).
 */
public record OperatorAnalytics(
        Long operatorId,
        String operatorName,
        long busCount,
        long tripCount,
        long bookingCount,
        long passengerCount,
        BigDecimal revenue,
        double occupancyRate
) {
}