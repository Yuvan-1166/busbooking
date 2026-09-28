package com.yuvan.busbooking.notification.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.notification.entity.ReportFrequency;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.notification.pdf.ReportPdfRenderer;
import com.yuvan.busbooking.notification.report.ReportData;
import com.yuvan.busbooking.notification.report.ReportGeneratorFactory;
import com.yuvan.busbooking.notification.report.ReportPeriod;
import com.yuvan.busbooking.notification.report.ReportPeriodResolver;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Locale;

/**
 * Builds a report on demand and hands it back as a downloadable file.
 *
 * <p>Reuses the scheduled-report pipeline — same generators, same entitlement
 * rules — so a downloaded report can never cover a different slice of data than
 * the emailed one. A download needs no subscription: the only question is
 * whether the caller is allowed to see that report at all.</p>
 */
@Service
@Transactional(readOnly = true)
public class ReportExportService {

    private static final ReportFrequency DEFAULT_FREQUENCY = ReportFrequency.MONTHLY;

    private final UserRepository userRepository;
    private final ReportEntitlementResolver entitlementResolver;
    private final ReportGeneratorFactory generatorFactory;
    private final ReportPeriodResolver periodResolver;
    private final ReportPdfRenderer pdfRenderer;

    public ReportExportService(
            UserRepository userRepository,
            ReportEntitlementResolver entitlementResolver,
            ReportGeneratorFactory generatorFactory,
            ReportPeriodResolver periodResolver,
            ReportPdfRenderer pdfRenderer
    ) {
        this.userRepository = userRepository;
        this.entitlementResolver = entitlementResolver;
        this.generatorFactory = generatorFactory;
        this.periodResolver = periodResolver;
        this.pdfRenderer = pdfRenderer;
    }

    /**
     * Renders the requested report as a PDF.
     *
     * @param email    the caller, whose roles decide what they may see
     * @param requested the report kind asked for; falls back to the platform
     *                 report when an admin has no operator profile
     * @param frequency window to use when no explicit range is given
     * @param from     inclusive custom start date, or {@code null}
     * @param to       inclusive custom end date, or {@code null}
     * @return the encoded file and the name to save it under
     */
    public ReportFile renderPdf(String email, ReportType requested,
                                ReportFrequency frequency, LocalDate from, LocalDate to) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        ReportType reportType = entitlementResolver.effectiveReportType(user, requested);
        entitlementResolver.requireEntitled(user, reportType);

        ReportPeriod period = periodFor(frequency, from, to);
        ReportData data = generatorFactory.getGenerator(reportType).generate(user, period);

        return new ReportFile(pdfRenderer.render(data), fileName(reportType, period));
    }

    /**
     * An explicit range wins over the cadence; supplying only one bound is
     * rejected rather than guessed at.
     */
    private ReportPeriod periodFor(ReportFrequency frequency, LocalDate from, LocalDate to) {
        boolean hasFrom = from != null;
        boolean hasTo = to != null;

        if (hasFrom != hasTo) {
            throw new IllegalArgumentException(
                    "Provide both a start and an end date, or neither");
        }
        if (hasFrom) {
            return periodResolver.custom(from, to);
        }
        return periodResolver.resolve(frequency == null ? DEFAULT_FREQUENCY : frequency);
    }

    private String fileName(ReportType reportType, ReportPeriod period) {
        return reportType.name().toLowerCase(Locale.ROOT)
                + "-" + period.from() + "-to-" + period.to() + ".pdf";
    }

    /**
     * An encoded download.
     */
    public record ReportFile(byte[] content, String fileName) {
    }
}
