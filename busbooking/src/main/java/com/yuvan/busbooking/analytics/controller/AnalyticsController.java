package com.yuvan.busbooking.analytics.controller;

import com.yuvan.busbooking.analytics.dto.AnalyticsDashboard;
import com.yuvan.busbooking.analytics.service.AnalyticsService;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final OperatorRepository operatorRepository;
    private final UserRepository userRepository;

    public AnalyticsController(
            AnalyticsService analyticsService,
            OperatorRepository operatorRepository,
            UserRepository userRepository
    ) {
        this.analyticsService = analyticsService;
        this.operatorRepository = operatorRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<AnalyticsDashboard> dashboard(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,
            @RequestParam(required = false) Long operatorId
    ) {
        Long effectiveOperatorId;

        if (SecurityUtils.hasRole("ADMIN")) {
            effectiveOperatorId = operatorId;
        } else {
            effectiveOperatorId = resolveOperatorForCurrentUser();
        }

        return ResponseEntity.ok(
                analyticsService.getDashboard(from, to, effectiveOperatorId)
        );
    }

    private Long resolveOperatorForCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return operatorRepository.findByUserId(user.getId())
                .map(Operator::getId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No operator profile linked to current user"));
    }
}