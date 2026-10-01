package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.TotpVerifyRequest;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannel;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelFactory;
import com.yuvan.busbooking.auth.otp.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.service.OtpService;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;


import javax.naming.AuthenticationException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final OtpChannelFactory otpChannelFactory;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService,
            OtpService otpService,
            OtpChannelFactory otpChannelFactory,
            PasswordEncoder passwordEncoder,
            TotpService totpService,
            CustomUserDetailsService customUserDetailsService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.otpChannelFactory = otpChannelFactory;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
        this.customUserDetailsService = customUserDetailsService;
    }

    public LoginResponse login(LoginRequest request) throws AuthenticationException {

        User user = userRepository.findByEmail(request.email())
                    .orElseThrow(
                        () -> new IllegalArgumentException("User not found")
                    );
        if(!passwordEncoder.matches(request.password(), user.getPasswordHash())){
            throw new BadCredentialsException("Invalid Creds");
        }
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());

        // Check if user has TOTP enabled
        if (user.getTotpEnabled()) {
            // User has 2FA enabled - require TOTP verification
            String tempToken = jwtService.generateTempToken(userDetails);
            return new LoginResponse(true, tempToken, user.getId());
        }

        // User doesn't have 2FA - return full token immediately
        String token = jwtService.generateToken(userDetails);

        log.info("{} User Logged In", request.email());

        return new LoginResponse(token, "Bearer", 3600L);
    }

    @Transactional
    public LoginResponse verifyTotpAndLogin(TotpVerifyRequest request) {
        // Validate and extract email from temp token
        if (!jwtService.isTokenValid(request.tempToken())) {
            throw new IllegalArgumentException("Invalid or expired temporary token");
        }

        String email = jwtService.extractUsername(request.tempToken());
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
            log.info("{} TOTP Verification Failed");
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

        log.info("{} TOTP Verification Successfule", email);

        return new LoginResponse(fullToken, "Bearer", 3600L);
    }

    public ResetPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        try {
            OtpChannel channel = otpChannelFactory.getChannel(request.resolvedChannel());
            otpService.send(new SendOtpRequest(
                    channel.normalizeTarget(request.target()),
                    channel.getType(),
                    OtpPurpose.PASSWORD_RESET
            ));
        } catch (Exception ignored) {
            // Don't reveal whether the destination exists or not
        }

        log.info("Initialized Forgot Password");

        return new ResetPasswordResponse(
                "If an account exists for that destination, a reset code has been sent."
            );
    }

    @Transactional(noRollbackFor = OtpVerificationException.class)
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        OtpChannel channel = otpChannelFactory.getChannel(request.resolvedChannel());
        String target = channel.normalizeTarget(request.target());

        // Verify OTP — throws on failure
        otpService.confirm(new VerifyOtpRequest(
                target, request.otp().trim(), channel.getType(), OtpPurpose.PASSWORD_RESET));

        // Update the password
        User user = channel.findOwner(target)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found for " + channel.maskTarget(target)));

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
