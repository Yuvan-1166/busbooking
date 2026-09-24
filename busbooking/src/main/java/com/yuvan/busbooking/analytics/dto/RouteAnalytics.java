package com.yuvan.busbooking.analytics.dto;

import java.math.BigDecimal;

/**
 * Performance snapshot for a single route within the dashboard date range.
 */
public record RouteAnalytics(
        Long routeId,
        String routeName,
        long tripCount,
        long bookingCount,
        long passengerCount,
        BigDecimal revenue,
        double occupancyRate
) {
}