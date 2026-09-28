package com.yuvan.busbooking.notification.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.notification.dto.ReportPreferenceRequest;
import com.yuvan.busbooking.notification.dto.ReportPreferenceResponse;
import com.yuvan.busbooking.notification.entity.ReportPreference;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.notification.repository.ReportPreferenceRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Lifecycle of report subscriptions: opting in, changing frequency, opting
 * out, and triggering an immediate send. Subscribers are validated so a user
 * can only subscribe to report kinds their role is entitled to see.
 */
@Service
@Transactional
public class ReportPreferenceService {

    private final ReportPreferenceRepository preferenceRepository;
    private final ReportDispatchService dispatchService;
    private final ReportEntitlementResolver entitlementResolver;
    private final UserRepository userRepository;

    public ReportPreferenceService(
            ReportPreferenceRepository preferenceRepository,
            ReportDispatchService dispatchService,
            ReportEntitlementResolver entitlementResolver,
            UserRepository userRepository
    ) {
        this.preferenceRepository = preferenceRepository;
        this.dispatchService = dispatchService;
        this.entitlementResolver = entitlementResolver;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReportPreferenceResponse> getMyPreferences(String email) {
        User user = resolveUser(email);
        return preferenceRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ReportPreferenceResponse upsert(String email, ReportPreferenceRequest request) {
        User user = resolveUser(email);
        entitlementResolver.requireEntitled(user, request.reportType());

        ReportPreference preference =
                preferenceRepository.findByUserIdAndReportType(user.getId(), request.reportType())
                        .orElseGet(() -> {
                            ReportPreference created = new ReportPreference();
                            created.setUser(user);
                            created.setReportType(request.reportType());
                            created.setNextRunAt(LocalDateTime.now());
                            return created;
                        });

        boolean wasActive = Boolean.TRUE.equals(preference.getActive());
        boolean nowActive = request.active() == null ? wasActive : request.active();

        preference.setFrequency(request.frequency());
        preference.setActive(nowActive);
        if (!wasActive && nowActive) {
            // Re-opt-in: deliver promptly instead of waiting a full cycle.
            preference.setNextRunAt(LocalDateTime.now());
        }

        return toResponse(preferenceRepository.save(preference));
    }

    public void remove(String email, ReportType reportType) {
        User user = resolveUser(email);
        ReportPreference preference = preferenceRepository
                .findByUserIdAndReportType(user.getId(), reportType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No report subscription for " + reportType));
        preferenceRepository.delete(preference);
    }

    public ReportPreferenceResponse sendNow(String email, ReportType reportType) {
        User user = resolveUser(email);
        ReportPreference preference = preferenceRepository
                .findByUserIdAndReportType(user.getId(), reportType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subscribe to the " + reportType + " report before requesting a send"));
        ReportDispatchService.DispatchResult result = dispatchService.dispatch(preference);
        if (!result.sent()) {
            throw new IllegalStateException(
                    "Report delivery failed: " + result.errorMessage());
        }
        return toResponse(preference);
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + email));
    }

    private ReportPreferenceResponse toResponse(ReportPreference preference) {
        return new ReportPreferenceResponse(
                preference.getId(),
                preference.getReportType(),
                preference.getFrequency(),
                Boolean.TRUE.equals(preference.getActive()),
                preference.getNextRunAt(),
                preference.getLastSentAt()
        );
    }
}