package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Resolves the analysable date window for a given recurrence cadence, or
 * validates an explicit window supplied by an on-demand export.
 */
@Component
public class ReportPeriodResolver {

    /**
     * Longest window an on-demand export may cover. Analytics aggregates the
     * whole range in memory, so an unbounded request would be a cheap way to
     * exhaust the heap.
     */
    static final int MAX_CUSTOM_DAYS = 366;

    /**
     * @param frequency the subscription cadence
     * @return the inclusive period the report should cover
     */
    public ReportPeriod resolve(ReportFrequency frequency) {
        LocalDate today = LocalDate.now();
        return switch (frequency) {
            case DAILY -> new ReportPeriod(today.minusDays(1), today.minusDays(1));
            case WEEKLY -> new ReportPeriod(today.minusDays(7), today);
            case MONTHLY -> new ReportPeriod(today.minusDays(30), today);
        };
    }

    /**
     * Validates an explicitly requested window instead of deriving one from a
     * cadence.
     *
     * @param from inclusive start date
     * @param to   inclusive end date
     * @return the requested period, unchanged
     * @throws IllegalArgumentException if a bound is missing, the window runs
     *                                  backwards, or it exceeds
     *                                  {@value #MAX_CUSTOM_DAYS} days
     */
    public ReportPeriod custom(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException(
                    "A custom range needs both a start and an end date");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException(
                    "The start date must not be after the end date");
        }
        long days = to.toEpochDay() - from.toEpochDay() + 1;
        if (days > MAX_CUSTOM_DAYS) {
            throw new IllegalArgumentException(
                    "A custom range cannot span more than " + MAX_CUSTOM_DAYS + " days");
        }
        return new ReportPeriod(from, to);
    }
}