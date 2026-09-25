package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves a {@link ReportGenerator} from its
 * {@link ReportType}.
 *
 * <p>All {@link ReportGenerator} beans are injected and indexed by the report
 * type they {@link ReportGenerator#supports()}. Adding a new report type
 * therefore requires only a new bean — it is picked up automatically here.</p>
 */
@Service
public class ReportGeneratorFactory {

    private final Map<ReportType, ReportGenerator> generators;

    public ReportGeneratorFactory(List<ReportGenerator> generatorList) {
        this.generators = generatorList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        ReportGenerator::supports,
                        Function.identity()
                ));
    }

    /**
     * Resolves the generator responsible for the given report type.
     *
     * @param reportType the requested report kind.
     * @return the matching {@link ReportGenerator}.
     * @throws IllegalArgumentException if no generator is registered.
     */
    public ReportGenerator getGenerator(ReportType reportType) {
        ReportGenerator generator = generators.get(reportType);
        if (generator == null) {
            throw new IllegalArgumentException("No report generator for type: " + reportType);
        }
        return generator;
    }
}