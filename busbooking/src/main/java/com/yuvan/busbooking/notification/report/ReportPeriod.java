package com.yuvan.busbooking.notification.report;

import java.time.LocalDate;

/**
 * Inclusive date window covered by a report.
 */
public record ReportPeriod(LocalDate from, LocalDate to) {
}