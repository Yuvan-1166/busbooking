package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.auth.dto.OtpVerifyResponse;
import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.dto.TotpVerifyRequest;
import com.yuvan.busbooking.auth.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.AuthService;
import com.yuvan.busbooking.auth.service.OnboardingService;
import com.yuvan.busbooking.auth.service.OtpService;
import com.yuvan.busbooking.auth.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final OnboardingService onboardingService;
    private final RegistrationService registrationService;

    public AuthController(
            AuthService authService,
            OtpService otpService,
            OnboardingService onboardingService,
            RegistrationService registrationService
    ) {
        this.authService = authService;
        this.otpService = otpService;
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

    /**
     * Verify TOTP code and complete login
     * POST /api/v1/auth/login/verify-totp
     */
    @PostMapping("/login/verify-totp")
    public LoginResponse verifyTotpAndLogin(
            @Valid @RequestBody TotpVerifyRequest request
    ) {
        return authService.verifyTotpAndLogin(request);
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
     * On success, activates the user account and allows them to log in.
     * TOTP 2FA setup is now optional and can be done from the profile page.
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
     * Returns new JWT token with updated roles.
     *
     * POST /api/v1/auth/onboarding/complete
     * Requires authentication.
     */
    @PostMapping("/onboarding/complete")
    public LoginResponse completeOnboarding(
            @Valid @RequestBody OnboardingCompleteRequest request
    ) {
        return onboardingService.completeOnboarding(request);
    }
}
