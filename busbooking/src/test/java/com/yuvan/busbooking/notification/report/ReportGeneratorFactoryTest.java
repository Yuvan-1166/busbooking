package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportFrequency;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.user.entity.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReportGeneratorFactoryTest {

    private final ReportGenerator operatorGenerator = stub(ReportType.OPERATOR_PERFORMANCE);
    private final ReportGenerator platformGenerator = stub(ReportType.PLATFORM_SUMMARY);

    @Test
    void resolvesRegisteredGeneratorsByType() {
        ReportGeneratorFactory factory =
                new ReportGeneratorFactory(List.of(operatorGenerator, platformGenerator));

        assertThat(factory.getGenerator(ReportType.OPERATOR_PERFORMANCE))
                .isSameAs(operatorGenerator);
        assertThat(factory.getGenerator(ReportType.PLATFORM_SUMMARY))
                .isSameAs(platformGenerator);
    }

    @Test
    void throwsForUnsupportedType() {
        ReportGeneratorFactory factory =
                new ReportGeneratorFactory(List.of(platformGenerator));

        assertThatThrownBy(() -> factory.getGenerator(ReportType.OPERATOR_PERFORMANCE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("OPERATOR_PERFORMANCE");
    }

    @Test
    void rejectsDuplicatedTypeRegistrations() {
        assertThatThrownBy(() -> new ReportGeneratorFactory(
                List.of(operatorGenerator, stub(ReportType.OPERATOR_PERFORMANCE))))
                .isInstanceOf(IllegalStateException.class);
    }

    private ReportGenerator stub(ReportType type) {
        return new ReportGenerator() {
            @Override
            public ReportType supports() {
                return type;
            }

            @Override
            public ReportData generate(User user, ReportPeriod period) {
                return new ReportData(
                        "test", "TEST", "period", "user",
                        List.of(),
                        List.of(new ReportData.DataSection(
                                "s", List.of("h"),
                                List.of(List.of("v")))));
            }
        };
    }
}