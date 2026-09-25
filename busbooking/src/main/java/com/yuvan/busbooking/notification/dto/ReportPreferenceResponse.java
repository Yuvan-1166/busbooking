package com.yuvan.busbooking.notification.dto;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import com.yuvan.busbooking.notification.entity.ReportType;

import java.time.LocalDateTime;

/**
 * Read model of a user's report subscription.
 */
public record ReportPreferenceResponse(
        Long id,
        ReportType reportType,
        ReportFrequency frequency,
        boolean active,
        LocalDateTime nextRunAt,
        LocalDateTime lastSentAt
) {
}