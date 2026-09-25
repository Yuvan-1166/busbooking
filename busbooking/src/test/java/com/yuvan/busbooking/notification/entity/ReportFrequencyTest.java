package com.yuvan.busbooking.notification.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ReportFrequencyTest {

    private final LocalDateTime now = LocalDateTime.of(2026, 9, 24, 8, 30);

    @Test
    void dailyAdvancesByOneDay() {
        assertThat(ReportFrequency.DAILY.nextRunAt(now))
                .isEqualTo(now.plusDays(1));
    }

    @Test
    void weeklyAdvancesByOneWeek() {
        assertThat(ReportFrequency.WEEKLY.nextRunAt(now))
                .isEqualTo(now.plusWeeks(1));
    }

    @Test
    void monthlyAdvancesByOneMonth() {
        assertThat(ReportFrequency.MONTHLY.nextRunAt(now))
                .isEqualTo(now.plusMonths(1));
    }
}