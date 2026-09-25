package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Resolves the analysable date window for a given recurrence cadence.
 */
@Component
public class ReportPeriodResolver {

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
}