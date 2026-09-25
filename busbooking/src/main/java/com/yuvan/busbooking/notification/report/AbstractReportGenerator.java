package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.analytics.dto.AnalyticsDashboard;
import com.yuvan.busbooking.analytics.dto.AnalyticsSummary;
import com.yuvan.busbooking.analytics.service.AnalyticsService;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Shared formatting and analytics access for report generators.
 *
 * <p>Aggregation itself is delegated to {@link AnalyticsService}, which runs
 * single-pass, batch-loading queries (grouping joined records by key with
 * {@code IN} lookups) rather than per-row trips to the database.</p>
 */
public abstract class AbstractReportGenerator implements ReportGenerator {

    /** Indian locale groups digits with commas and renders rupees nicely. */
    protected static final Locale LOCALE = new Locale("en", "IN");
    private static final DateTimeFormatter PERIOD_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy", LOCALE);

    protected final AnalyticsService analyticsService;

    protected AbstractReportGenerator(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    protected AnalyticsDashboard loadDashboard(ReportPeriod period, Long operatorId) {
        return analyticsService.getDashboard(period.from(), period.to(), operatorId);
    }

    protected String periodLabel(ReportPeriod period) {
        return PERIOD_FORMAT.format(period.from()) + " – " + PERIOD_FORMAT.format(period.to());
    }

    protected static List<ReportData.KeyMetric> summaryMetrics(AnalyticsSummary s) {
        List<ReportData.KeyMetric> metrics = new ArrayList<>();
        metrics.add(metric("Revenue", money(s.totalRevenue())));
        metrics.add(metric("Bookings", number(s.totalBookings())));
        metrics.add(metric("Passengers", number(s.totalPassengers())));
        metrics.add(metric("Cancellations", number(s.totalCancellations())));
        if (s.refundedAmount() != null && s.refundedAmount().signum() != 0) {
            metrics.add(metric("Refunds", money(s.refundedAmount())));
        }
        metrics.add(metric("Avg Occupancy", s.averageOccupancy() + "%"));
        metrics.add(metric("Trips", number(s.totalTrips())));
        metrics.add(metric("Buses", number(s.totalBuses())));
        metrics.add(metric("Seats", number(s.totalSeats())));
        return metrics;
    }

    protected static ReportData.KeyMetric metric(String label, String value) {
        return new ReportData.KeyMetric(label, value);
    }

    protected static String money(BigDecimal amount) {
        return "₹" + String.format(LOCALE, "%,.2f", amount == null ? BigDecimal.ZERO : amount);
    }

    protected static String number(long value) {
        return String.format(LOCALE, "%,d", value);
    }

    protected static String percent(double value) {
        return String.format(LOCALE, "%.1f%%", value);
    }
}