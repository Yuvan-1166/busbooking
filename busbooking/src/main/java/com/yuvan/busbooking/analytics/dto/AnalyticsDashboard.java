package com.yuvan.busbooking.analytics.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Complete analytics dashboard payload.
 *
 * @param from                start of the analysed date range (inclusive)
 * @param to                  end of the analysed date range (inclusive)
 * @param operatorId          scope of the report; {@code null} for the whole platform
 * @param summary             KPI metric cards
 * @param trend               per-day bookings / revenue series
 * @param userGrowth          per-day new registrations (admin scope only)
 * @param routePerformance    per-route aggregation, sorted by revenue desc
 * @param busPerformance      per-bus aggregation, sorted by revenue desc
 * @param operatorPerformance per-operator aggregation (admin scope only)
 */
public record AnalyticsDashboard(
        LocalDate from,
        LocalDate to,
        Long operatorId,
        AnalyticsSummary summary,
        List<TrendPoint> trend,
        List<CountPoint> userGrowth,
        List<RouteAnalytics> routePerformance,
        List<BusAnalytics> busPerformance,
        List<OperatorAnalytics> operatorPerformance
) {
}