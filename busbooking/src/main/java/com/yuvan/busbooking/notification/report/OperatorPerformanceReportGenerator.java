package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.analytics.dto.AnalyticsDashboard;
import com.yuvan.busbooking.analytics.service.AnalyticsService;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Generates a fleet-scoped performance report for the operator linked to the
 * subscribed user. Metrics are aggregated by {@link AnalyticsService} limited
 * to that operator's buses.
 */
@Service
public class OperatorPerformanceReportGenerator extends AbstractReportGenerator {

    private static final String BADGE = "OPERATOR REPORT";

    private final OperatorRepository operatorRepository;

    public OperatorPerformanceReportGenerator(
            AnalyticsService analyticsService,
            OperatorRepository operatorRepository
    ) {
        super(analyticsService);
        this.operatorRepository = operatorRepository;
    }

    @Override
    public ReportType supports() {
        return ReportType.OPERATOR_PERFORMANCE;
    }

    @Override
    public ReportData generate(User user, ReportPeriod period) {
        Operator operator = operatorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No operator profile is linked to this account"));

        AnalyticsDashboard dashboard =
                loadDashboard(period, operator.getId());

        List<ReportData.DataSection> sections = List.of(
                routeSection(dashboard),
                busSection(dashboard)
        );

        return new ReportData(
                "Your operator performance report",
                BADGE,
                periodLabel(period),
                user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : ""),
                summaryMetrics(dashboard.summary()),
                sections
        );
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

    private ReportData.DataSection busSection(AnalyticsDashboard dashboard) {
        List<String> headers = List.of("Bus", "Model", "Trips", "Bookings", "Revenue", "Occupancy");
        List<List<String>> rows = dashboard.busPerformance().stream()
                .map(b -> List.of(
                        b.registrationNumber(),
                        b.model(),
                        number(b.tripCount()),
                        number(b.bookingCount()),
                        money(b.revenue()),
                        percent(b.occupancyRate())))
                .toList();
        return new ReportData.DataSection("Top buses", headers, rows);
    }
}