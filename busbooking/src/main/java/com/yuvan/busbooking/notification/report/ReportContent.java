package com.yuvan.busbooking.notification.report;

/**
 * A fully rendered report ready for delivery.
 */
public record ReportContent(String subject, String htmlBody) {
}