package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.analytics.dto.AnalyticsDashboard;
import com.yuvan.busbooking.analytics.dto.AnalyticsSummary;
import com.yuvan.busbooking.analytics.service.AnalyticsService;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.user.entity.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates a whole-platform summary for administrators, including growth and
 * cross-operator comparison.
 */
@Service
public class PlatformSummaryReportGenerator extends AbstractReportGenerator {

    private static final String BADGE = "PLATFORM REPORT";

    public PlatformSummaryReportGenerator(AnalyticsService analyticsService) {
        super(analyticsService);
    }

    @Override
    public ReportType supports() {
        return ReportType.PLATFORM_SUMMARY;
    }

    @Override
    public ReportData generate(User user, ReportPeriod period) {
        AnalyticsDashboard dashboard = loadDashboard(period, null);

        AnalyticsSummary summary = dashboard.summary();
        List<ReportData.KeyMetric> metrics = new ArrayList<>(summaryMetrics(summary));
        if (summary.newUsers() != null) {
            metrics.add(metric("New users", number(summary.newUsers())));
            metrics.add(metric("Total users", number(summary.totalUsers())));
            metrics.add(metric("Operators", number(summary.totalOperators())));
            metrics.add(metric("Routes", number(summary.totalRoutes())));
        }

        List<ReportData.DataSection> sections = List.of(
                operatorSection(dashboard),
                routeSection(dashboard)
        );

        return new ReportData(
                "Bus Booking platform summary",
                BADGE,
                periodLabel(period),
                user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : ""),
                metrics,
                sections
        );
    }

    private ReportData.DataSection operatorSection(AnalyticsDashboard dashboard) {
        List<String> headers = List.of("Operator", "Buses", "Trips", "Bookings", "Revenue", "Occupancy");
        List<List<String>> rows = dashboard.operatorPerformance().stream()
                .map(o -> List.of(
                        o.operatorName(),
                        number(o.busCount()),
                        number(o.tripCount()),
                        number(o.bookingCount()),
                        money(o.revenue()),
                        percent(o.occupancyRate())))
                .toList();
        return new ReportData.DataSection("Top operators", headers, rows);
    }

    private ReportData.DataSection routeSection(AnalyticsDashboard dashboard) {
        List<String> headers = List.of("Route", "Trips", "Bookings", "Passengers", "Revenue", "Occupancy");
        List<List<String>> rows = dashboard.routePerformance().stream()
                .map(r -> List.of(
                        r.routeName(),
                        number(r.tripCount()),
                        number(r.bookingCount()),
                        number(r.passengerCount()),
                        money(r.revenue()),
                        percent(r.occupancyRate())))
                .toList();
        return new ReportData.DataSection("Top routes", headers, rows);
    }
}