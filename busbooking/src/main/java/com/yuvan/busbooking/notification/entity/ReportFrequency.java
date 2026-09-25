package com.yuvan.busbooking.notification.entity;

import java.time.LocalDateTime;

/**
 * Recurrence cadence for a report subscription.
 */
public enum ReportFrequency {

    DAILY,
    WEEKLY,
    MONTHLY;

    /**
     * Computes the next scheduled execution after the given instant.
     *
     * @param from the instant of the current (just-completed) run
     * @return the timestamp of the following scheduled run
     */
    public LocalDateTime nextRunAt(LocalDateTime from) {
        return switch (this) {
            case DAILY -> from.plusDays(1);
            case WEEKLY -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
        };
    }
}