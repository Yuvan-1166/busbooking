package com.yuvan.busbooking.notification.controller;

import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.notification.dto.ReportPreferenceRequest;
import com.yuvan.busbooking.notification.dto.ReportPreferenceResponse;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.notification.service.ReportPreferenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Self-service API for operators and admins to manage their recurring emailed
 * reports. All endpoints act on the authenticated user's own subscriptions.
 */
@RestController
@RequestMapping("/api/v1/report-preferences")
public class ReportNotificationController {

    private final ReportPreferenceService reportPreferenceService;

    public ReportNotificationController(ReportPreferenceService reportPreferenceService) {
        this.reportPreferenceService = reportPreferenceService;
    }

    /** Lists the authenticated user's report subscriptions. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<ReportPreferenceResponse> getMyPreferences() {
        return reportPreferenceService.getMyPreferences(
                SecurityUtils.getCurrentUserEmail());
    }

    /** Opts in / updates the cadence of a report subscription. */
    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ReportPreferenceResponse upsert(
            @Valid @RequestBody ReportPreferenceRequest request
    ) {
        return reportPreferenceService.upsert(
                SecurityUtils.getCurrentUserEmail(), request);
    }

    /** Opts out: removes a report subscription entirely. */
    @DeleteMapping("/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Void> remove(@PathVariable ReportType reportType) {
        reportPreferenceService.remove(
                SecurityUtils.getCurrentUserEmail(), reportType);
        return ResponseEntity.noContent().build();
    }

    /** Delivers the report immediately, outside the recurring schedule. */
    @PostMapping("/{reportType}/send-now")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ReportPreferenceResponse sendNow(@PathVariable ReportType reportType) {
        return reportPreferenceService.sendNow(
                SecurityUtils.getCurrentUserEmail(), reportType);
    }
}