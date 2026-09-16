package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.dto.GoogleOAuthRequest;
import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.auth.dto.OperatorRegisterRequest;
import com.yuvan.busbooking.auth.dto.OperatorRegisterResponse;
import com.yuvan.busbooking.auth.dto.OtpVerifyResponse;
import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.AuthService;
import com.yuvan.busbooking.auth.service.GoogleOAuthService;
import com.yuvan.busbooking.auth.service.OnboardingService;
import com.yuvan.busbooking.auth.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final GoogleOAuthService googleOAuthService;
    private final OnboardingService onboardingService;

    public AuthController(AuthService authService, OtpService otpService, GoogleOAuthService googleOAuthService, OnboardingService onboardingService) {
        this.authService = authService;
        this.otpService = otpService;
        this.googleOAuthService = googleOAuthService;
        this.onboardingService = onboardingService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }

    @PostMapping("/operator/register")
    @ResponseStatus(HttpStatus.CREATED)
    public OperatorRegisterResponse registerOperator(
            @Valid @RequestBody OperatorRegisterRequest request
    ) {
        return authService.registerOperator(request);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    /**
     * Sends (or resends) a 6-digit OTP to the given email address.
     * The account must exist and must still be PENDING_VERIFICATION.
     *
     * POST /api/v1/auth/verify/send
     */
    @PostMapping("/verify/send")
    public OtpVerifyResponse sendOtp(
            @Valid @RequestBody SendOtpRequest request
    ) {
        otpService.generateAndSend(request.email(), OtpPurpose.REGISTRATION);
        return new OtpVerifyResponse(
                "Verification code sent to " + request.email());
    }

    /**
     * Confirms the 6-digit OTP submitted by the user.
     * On success the account becomes ACTIVE and the user can log in.
     *
     * POST /api/v1/auth/verify/confirm
     */
    @PostMapping("/verify/confirm")
    public OtpVerifyResponse confirmOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        otpService.verify(request.email(), request.otp(), OtpPurpose.REGISTRATION);
        return new OtpVerifyResponse("Email verified successfully. You can now sign in.");
    }

    /**
     * Initiates a password reset by sending an OTP to the given email address.
     * Silently succeeds even if the email is not registered (prevents user enumeration).
     *
     * POST /api/v1/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResetPasswordResponse forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return authService.forgotPassword(request);
    }

    /**
     * Verifies the OTP and updates the user's password in one step.
     *
     * POST /api/v1/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResetPasswordResponse resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        return authService.resetPassword(request);
    }

    /**
     * Completes user onboarding after Google OAuth.
     * Assigns role, saves profile details, creates operator if needed.
     *
     * POST /api/v1/auth/onboarding/complete
     * Requires authentication.
     */
    @PostMapping("/onboarding/complete")
    public OtpVerifyResponse completeOnboarding(
            @Valid @RequestBody OnboardingCompleteRequest request
    ) {
        System.out.println("=== Onboarding Complete Endpoint ===");
        onboardingService.completeOnboarding(request);
        return new OtpVerifyResponse("Onboarding completed successfully. Welcome!");
    }
    @PostMapping("/google")
    public LoginResponse googleOAuth(
            @Valid @RequestBody GoogleOAuthRequest request
    ) {
        System.out.println("=== Google OAuth Endpoint Called ===");
        System.out.println("Request: " + request);
        System.out.println("User Type: " + request.userType());
        System.out.println("Token: " + (request.idToken() != null ? request.idToken().substring(0, Math.min(50, request.idToken().length())) + "..." : "NULL"));
        
        LoginResponse response = googleOAuthService.authenticateWithGoogle(request.idToken(), request.userType());
        System.out.println("=== Google OAuth Endpoint Returning ===");
        return response;
    }
}
