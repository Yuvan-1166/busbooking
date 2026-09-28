package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.dto.TotpVerifyRequest;
import com.yuvan.busbooking.auth.otp.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.service.AuthService;
import com.yuvan.busbooking.auth.service.OnboardingService;
import com.yuvan.busbooking.auth.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final OnboardingService onboardingService;
    private final RegistrationService registrationService;

    public AuthController(
            AuthService authService,
            OnboardingService onboardingService,
            RegistrationService registrationService
    ) {
        this.authService = authService;
        this.onboardingService = onboardingService;
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return registrationService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @PostMapping("/login/verify-totp")
    public LoginResponse verifyTotpAndLogin(
            @Valid @RequestBody TotpVerifyRequest request
    ) {
        return authService.verifyTotpAndLogin(request);
    }

    @PostMapping("/forgot-password")
    public ResetPasswordResponse forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ResetPasswordResponse resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        return authService.resetPassword(request);
    }

    @PostMapping("/onboarding/complete")
    public LoginResponse completeOnboarding(
            @Valid @RequestBody OnboardingCompleteRequest request
    ) {
        return onboardingService.completeOnboarding(request);
    }
}
