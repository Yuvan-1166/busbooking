package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

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

    @Test
    void customKeepsTheRequestedWindow() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 3, 31);

        ReportPeriod period = resolver.custom(from, to);

        assertThat(period.from()).isEqualTo(from);
        assertThat(period.to()).isEqualTo(to);
    }

    @Test
    void customAcceptsASingleDay() {
        LocalDate day = LocalDate.of(2026, 1, 1);

        assertThat(resolver.custom(day, day)).isEqualTo(new ReportPeriod(day, day));
    }

    @Test
    void customRejectsAMissingBound() {
        LocalDate day = LocalDate.of(2026, 1, 1);

        assertThatIllegalArgumentException()
                .isThrownBy(() -> resolver.custom(day, null));
        assertThatIllegalArgumentException()
                .isThrownBy(() -> resolver.custom(null, day));
    }

    @Test
    void customRejectsABackwardsWindow() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> resolver.custom(
                        LocalDate.of(2026, 3, 31), LocalDate.of(2026, 1, 1)));
    }

    @Test
    void customRejectsAWindowLongerThanTheCap() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> resolver.custom(
                        LocalDate.of(2024, 1, 1), LocalDate.of(2026, 1, 1)));
    }
}