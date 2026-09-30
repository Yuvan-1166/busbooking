package com.yuvan.busbooking.notification.controller;

import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.notification.dto.ReportPreferenceRequest;
import com.yuvan.busbooking.notification.dto.ReportPreferenceResponse;
import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.notification.service.ReportPreferenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import com.yuvan.busbooking.common.util.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/report-preferences")
public class ReportNotificationController {

    private final ReportPreferenceService reportPreferenceService;

    public ReportNotificationController(ReportPreferenceService reportPreferenceService) {
        this.reportPreferenceService = reportPreferenceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<ReportPreferenceResponse> getMyPreferences() {
        return reportPreferenceService.getMyPreferences(
                SecurityUtils.getCurrentUserEmail());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ReportPreferenceResponse upsert(
            @Valid @RequestBody ReportPreferenceRequest request
    ) {
        return reportPreferenceService.upsert(
                SecurityUtils.getCurrentUserEmail(), request);
    }

    @DeleteMapping("/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Void> remove(@PathVariable ReportType reportType) {
        reportPreferenceService.remove(
                SecurityUtils.getCurrentUserEmail(), reportType);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reportType}/send-now")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ReportPreferenceResponse sendNow(@PathVariable ReportType reportType) {
        return reportPreferenceService.sendNow(
                SecurityUtils.getCurrentUserEmail(), reportType);
    }
}