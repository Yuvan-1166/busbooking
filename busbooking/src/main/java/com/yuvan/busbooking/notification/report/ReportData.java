package com.yuvan.busbooking.notification.report;

import java.util.List;

/**
 * Structured, renderer-agnostic payload produced by a {@link ReportGenerator}.
 *
 * <p>The generator computes and aggregates the metrics; the email builder is
 * responsible only for presenting them, keeping the two concerns decoupled.</p>
 */
public record ReportData(
        String title,
        String badgeLabel,
        String periodLabel,
        String recipientName,
        List<KeyMetric> metrics,
        List<DataSection> sections
) {

    public record KeyMetric(String label, String value) {
    }

    public record DataSection(String title, List<String> headers, List<List<String>> rows) {
    }
}