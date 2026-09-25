package com.yuvan.busbooking.notification.scheduler;

import com.yuvan.busbooking.notification.entity.ReportPreference;
import com.yuvan.busbooking.notification.repository.ReportPreferenceRepository;
import com.yuvan.busbooking.notification.service.ReportDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Periodic scan that delivers every due report subscription.
 *
 * <p>The underlying query is index-backed and row-locked
 * (see {@link ReportPreferenceRepository#findDueForUpdate}), so a scan is
 * O(due rows), retries are bounded by {@code RETRY_DELAY_MINUTES}, and
 * concurrent application instances cannot double-deliver. Success advances
 * the schedule by the subscription frequency; failure defers the next attempt.
 * </p>
 */
@Component
public class ReportNotificationScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(ReportNotificationScheduler.class);

    private final ReportPreferenceRepository preferenceRepository;
    private final ReportDispatchService dispatchService;

    public ReportNotificationScheduler(
            ReportPreferenceRepository preferenceRepository,
            ReportDispatchService dispatchService
    ) {
        this.preferenceRepository = preferenceRepository;
        this.dispatchService = dispatchService;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void deliverDueReports() {
        LocalDateTime now = LocalDateTime.now();
        List<ReportPreference> due = preferenceRepository.findDueForUpdate(now);

        for (ReportPreference preference : due) {
            ReportDispatchService.DispatchResult result = dispatchService.dispatch(preference);
            if (result.sent()) {
                preference.markDelivered(now);
                log.info("Sent {} report to {}",
                        preference.getReportType(), preference.getUser().getEmail());
            } else {
                preference.scheduleRetry(now);
                log.warn("Delivery failed for {} report to {}; retrying in {} minutes: {}",
                        preference.getReportType(), preference.getUser().getEmail(),
                        ReportPreference.RETRY_DELAY_MINUTES, result.errorMessage());
            }
        }
    }
}