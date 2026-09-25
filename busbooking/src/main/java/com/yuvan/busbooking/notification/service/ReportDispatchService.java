package com.yuvan.busbooking.notification.service;

import com.yuvan.busbooking.notification.email.ReportEmailBuilder;
import com.yuvan.busbooking.notification.email.ReportEmailSender;
import com.yuvan.busbooking.notification.entity.ReportDeliveryLog;
import com.yuvan.busbooking.notification.entity.ReportDeliveryStatus;
import com.yuvan.busbooking.notification.entity.ReportPreference;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.notification.report.ReportContent;
import com.yuvan.busbooking.notification.report.ReportData;
import com.yuvan.busbooking.notification.report.ReportGenerator;
import com.yuvan.busbooking.notification.report.ReportGeneratorFactory;
import com.yuvan.busbooking.notification.report.ReportPeriod;
import com.yuvan.busbooking.notification.report.ReportPeriodResolver;
import com.yuvan.busbooking.notification.repository.ReportDeliveryLogRepository;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Executes one report delivery: resolves the generator via the factory,
 * aggregates the data, renders the email, sends it, and records the outcome.
 *
 * <p>A subscriber without a linked operator profile cannot receive the operator
 * report; admins in that situation receive the platform report instead
 * (see {@link #effectiveReportType}). Delivery failures never propagate as
 * exceptions — they are recorded as {@link ReportDeliveryStatus#FAILED} and
 * surfaced through {@link DispatchResult}, so the caller can opt to retry
 * without poisoning the surrounding transaction.</p>
 */
@Service
@Transactional
public class ReportDispatchService {

    private static final Logger log =
            LoggerFactory.getLogger(ReportDispatchService.class);

    private final ReportGeneratorFactory generatorFactory;
    private final ReportPeriodResolver periodResolver;
    private final ReportEmailBuilder emailBuilder;
    private final ReportEmailSender emailSender;
    private final ReportDeliveryLogRepository logRepository;
    private final OperatorRepository operatorRepository;
    private final UserRoleRepository userRoleRepository;

    public ReportDispatchService(
            ReportGeneratorFactory generatorFactory,
            ReportPeriodResolver periodResolver,
            ReportEmailBuilder emailBuilder,
            ReportEmailSender emailSender,
            ReportDeliveryLogRepository logRepository,
            OperatorRepository operatorRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.generatorFactory = generatorFactory;
        this.periodResolver = periodResolver;
        this.emailBuilder = emailBuilder;
        this.emailSender = emailSender;
        this.logRepository = logRepository;
        this.operatorRepository = operatorRepository;
        this.userRoleRepository = userRoleRepository;
    }

    /**
     * Delivers the report for {@code preference}.
     *
     * @return the outcome — {@link ReportDeliveryStatus#SENT} when the email
     *         went out, otherwise {@link ReportDeliveryStatus#FAILED} with a
     *         sanitised reason. Never throws for delivery-level failures.
     */
    public DispatchResult dispatch(ReportPreference preference) {
        ReportType effectiveType = effectiveReportType(preference);
        try {
            ReportGenerator generator = generatorFactory.getGenerator(effectiveType);
            ReportPeriod period = periodResolver.resolve(preference.getFrequency());
            ReportData data = generator.generate(preference.getUser(), period);
            ReportContent content = emailBuilder.build(data);
            emailSender.send(preference.getUser().getEmail(), content);
            record(preference, effectiveType, ReportDeliveryStatus.SENT, null);
            return DispatchResult.success();
        } catch (RuntimeException e) {
            log.error("Report delivery failed for {} to {}",
                    effectiveType, preference.getUser().getEmail(), e);
            record(preference, effectiveType, ReportDeliveryStatus.FAILED, sanitize(e));
            return DispatchResult.failed(e);
        }
    }

    /**
     * Resolves the report that should actually be generated for this
     * subscriber. Admins without a linked operator profile cannot receive the
     * operator report, so they get the platform report instead.
     */
    private ReportType effectiveReportType(ReportPreference preference) {
        if (preference.getReportType() != ReportType.OPERATOR_PERFORMANCE) {
            return preference.getReportType();
        }
        if (operatorRepository.findByUserId(preference.getUser().getId()).isPresent()) {
            return ReportType.OPERATOR_PERFORMANCE;
        }
        Set<RoleName> roles = userRoleRepository.findByUserIdWithRoles(preference.getUser().getId())
                .stream()
                .map(UserRole::getRole)
                .map(role -> role.getName())
                .collect(Collectors.toSet());
        if (roles.contains(RoleName.ADMIN)) {
            return ReportType.PLATFORM_SUMMARY;
        }
        return ReportType.OPERATOR_PERFORMANCE;
    }

    private void record(ReportPreference preference, ReportType reportType,
                        ReportDeliveryStatus status, String message) {
        ReportDeliveryLog log = new ReportDeliveryLog();
        log.setUser(preference.getUser());
        log.setReportType(reportType);
        log.setFrequency(preference.getFrequency());
        log.setRecipientEmail(preference.getUser().getEmail());
        log.setStatus(status);
        log.setErrorMessage(message);
        logRepository.save(log);
    }

    private String sanitize(RuntimeException e) {
        String message = e.getMessage();
        if (message == null || message.isBlank()) {
            return e.getClass().getSimpleName();
        }
        return message.length() <= 480 ? message : message.substring(0, 480);
    }

    /**
     * Outcome of a single delivery attempt.
     */
    public record DispatchResult(ReportDeliveryStatus status, String errorMessage) {

        public boolean sent() {
            return status == ReportDeliveryStatus.SENT;
        }

        private static DispatchResult success() {
            return new DispatchResult(ReportDeliveryStatus.SENT, null);
        }

        private static DispatchResult failed(RuntimeException e) {
            return new DispatchResult(ReportDeliveryStatus.FAILED,
                    e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
        }
    }
}