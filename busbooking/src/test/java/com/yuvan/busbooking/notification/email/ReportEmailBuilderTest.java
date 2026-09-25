package com.yuvan.busbooking.notification.email;

import com.yuvan.busbooking.notification.report.ReportContent;
import com.yuvan.busbooking.notification.report.ReportData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReportEmailBuilderTest {

    private final ReportEmailBuilder builder = new ReportEmailBuilder();

    @Test
    void rendersSubjectAndBadge() {
        ReportContent content = builder.build(data());

        assertThat(content.subject()).contains("OPERATOR REPORT");
        assertThat(content.subject()).contains("24 Sep 2026");
    }

    @Test
    void rendersMetricsAndSections() {
        ReportContent content = builder.build(data());

        assertThat(content.htmlBody()).contains("Total Revenue");
        assertThat(content.htmlBody()).contains("₹12,000.00");
        assertThat(content.htmlBody()).contains("Top routes");
        assertThat(content.htmlBody()).contains("Banglore → Chennai");
    }

    @Test
    void escapesHtmlInjectedValues() {
        ReportData malicious = new ReportData(
                "x <script>alert(1)</script>",
                "BADGE",
                "1 Sep 2026",
                "<b>Evil</b>",
                List.of(),
                List.of());

        ReportContent content = builder.build(malicious);

        assertThat(content.htmlBody()).doesNotContain("<script>");
        assertThat(content.htmlBody()).contains("&lt;script&gt;");
        assertThat(content.htmlBody()).doesNotContain("<b>Evil</b>");
        assertThat(content.htmlBody()).contains("&lt;b&gt;Evil&lt;/b&gt;");
    }

    @Test
    void leavesNoUnescapedPercentPlaceholders() {
        ReportContent content = builder.build(data());

        assertThat(content.htmlBody()).doesNotContain("%%");
        assertThat(content.htmlBody()).doesNotContain("%s");
    }

    private ReportData data() {
        return new ReportData(
                "Your operator performance report",
                "OPERATOR REPORT",
                "24 Sep 2026 – 24 Sep 2026",
                "Ravi Kumar",
                List.of(
                        new ReportData.KeyMetric("Total Revenue", "₹12,000.00"),
                        new ReportData.KeyMetric("Bookings", "42")),
                List.of(new ReportData.DataSection(
                        "Top routes",
                        List.of("Route", "Revenue"),
                        List.of(List.of("Banglore → Chennai", "₹12,000.00")))));
    }
}