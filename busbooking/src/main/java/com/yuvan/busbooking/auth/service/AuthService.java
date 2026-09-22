package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.dto.TotpVerifyRequest;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthService(
            UserRepository userRepository,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            OtpService otpService,
            PasswordEncoder passwordEncoder,
            TotpService totpService,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
        this.customUserDetailsService = customUserDetailsService;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.email(),
                                request.password()
                        )
                );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if user has TOTP enabled
        if (user.getTotpEnabled()) {
            // User has 2FA enabled - require TOTP verification
            String tempToken = jwtService.generateTempToken(userDetails);
            return new LoginResponse(true, tempToken, user.getId());
        }

        // User doesn't have 2FA - return full token immediately
        String token = jwtService.generateToken(userDetails);
        return new LoginResponse(token, "Bearer", 3600L);
    }

    /**
     * Verify TOTP code and complete login
     */
    @Transactional
    public LoginResponse verifyTotpAndLogin(TotpVerifyRequest request) {
        // Validate and extract email from temp token
        if (!jwtService.isTokenValid(request.tempToken())) {
            throw new IllegalArgumentException("Invalid or expired temporary token");
        }

        String email = jwtService.extractUsernameFromTempToken(request.tempToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify TOTP code or backup code
        boolean verified = false;
        try {
            verified = totpService.verifyTotp(user.getId(), request.totpCode().trim());
        } catch (IllegalStateException e) {
            // If TOTP verification fails due to rate limiting, throw immediately
            if (e.getMessage().contains("Too many failed attempts")) {
                throw e;
            }
            // Otherwise, try backup code
            verified = false;
        }

        if (!verified) {
            // Try backup code
            verified = totpService.verifyBackupCode(user.getId(), request.totpCode().trim());
        }

        if (!verified) {
            // Log failed attempt with IP and User-Agent
            totpService.logVerificationAttempt(
                user.getId(),
                com.yuvan.busbooking.auth.entity.TotpVerificationType.LOGIN,
                false,
                request.ipAddress(),
                request.userAgent()
            );
            throw new IllegalArgumentException("Invalid verification code");
        }

        // Log successful verification
        totpService.logVerificationAttempt(
            user.getId(),
            com.yuvan.busbooking.auth.entity.TotpVerificationType.LOGIN,
            true,
            request.ipAddress(),
            request.userAgent()
        );

        // Generate full JWT token
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        String fullToken = jwtService.generateToken(userDetails);

        return new LoginResponse(fullToken, "Bearer", 3600L);
    }

    /**
     * Initiates a password reset by sending an OTP to the given email.
     * Silently succeeds even if the email is not registered (prevents user enumeration).
     */
    public ResetPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        try {
            otpService.generateAndSendPasswordReset(request.email());
        } catch (Exception ignored) {
            // Don't reveal whether the email exists or not
        }
        return new ResetPasswordResponse(
                "If an account with that email exists, a reset code has been sent.");
    }

    /**
     * Verifies the OTP and updates the user's password in one step.
     */
    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        // Verify OTP — throws on failure
        otpService.verifyForPasswordReset(request.email(), request.otp().trim());

        // Update the password
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found: " + request.email()));

        if(passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException(
                        "New Password Must be different from your Current Password"
                );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new ResetPasswordResponse("Password reset successfully. You can now sign in.");
    }
}