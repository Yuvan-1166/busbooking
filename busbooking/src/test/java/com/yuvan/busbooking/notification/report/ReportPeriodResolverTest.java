package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ReportPeriodResolverTest {

    private final ReportPeriodResolver resolver = new ReportPeriodResolver();

    @Test
    void dailyCoversYesterdayOnly() {
        ReportPeriod period = resolver.resolve(ReportFrequency.DAILY);

        assertThat(period.from()).isEqualTo(LocalDate.now().minusDays(1));
        assertThat(period.to()).isEqualTo(period.from());
    }

    @Test
    void weeklyCoversLastSevenDays() {
        ReportPeriod period = resolver.resolve(ReportFrequency.WEEKLY);

        assertThat(period.from()).isEqualTo(LocalDate.now().minusDays(7));
        assertThat(period.to()).isEqualTo(LocalDate.now());
    }

    @Test
    void monthlyCoversLastThirtyDays() {
        ReportPeriod period = resolver.resolve(ReportFrequency.MONTHLY);

        assertThat(period.from()).isEqualTo(LocalDate.now().minusDays(30));
        assertThat(period.to()).isEqualTo(LocalDate.now());
    }
}