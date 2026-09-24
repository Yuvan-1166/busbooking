package com.yuvan.busbooking.analytics.dto;

import java.math.BigDecimal;

/**
 * KPI summary for an analytics dashboard.
 *
 * <p>All money figures are in the platform currency (INR). Occupancy is a
 * percentage representing the share of trip capacity that has been booked.</p>
 */
public record AnalyticsSummary(
        BigDecimal totalRevenue,
        long totalBookings,
        long totalPassengers,
        long totalTickets,
        long totalCancellations,
        BigDecimal refundedAmount,
        long totalTrips,
        long completedTrips,
        long cancelledTrips,
        long scheduledTrips,
        double averageOccupancy,
        long totalBuses,
        long totalSeats,
        Long newUsers,
        Long totalUsers,
        Long totalOperators,
        Long totalRoutes
) {
}