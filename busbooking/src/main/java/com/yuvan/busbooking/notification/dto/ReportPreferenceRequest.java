package com.yuvan.busbooking.notification.dto;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import com.yuvan.busbooking.notification.entity.ReportType;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for creating or updating a report subscription. When {@code active}
 * is absent the preference keeps (or defaults to) its current state.
 */
public record ReportPreferenceRequest(
        @NotNull(message = "Report type is required")
        ReportType reportType,

        @NotNull(message = "Frequency is required")
        ReportFrequency frequency,

        Boolean active
) {
}