package com.yuvan.busbooking.analytics.dto;

import java.math.BigDecimal;

/**
 * Performance snapshot for a single bus within the dashboard date range.
 */
public record BusAnalytics(
        Long busId,
        String registrationNumber,
        String model,
        long tripCount,
        long bookingCount,
        long passengerCount,
        BigDecimal revenue,
        double occupancyRate
) {
}