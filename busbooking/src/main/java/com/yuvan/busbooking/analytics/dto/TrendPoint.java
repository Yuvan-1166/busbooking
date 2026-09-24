package com.yuvan.busbooking.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A single day's bookings / revenue within the dashboard date range.
 */
public record TrendPoint(
        LocalDate date,
        long bookings,
        long passengers,
        BigDecimal revenue
) {
}