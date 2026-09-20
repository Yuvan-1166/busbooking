package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.OtpVerification;
import com.yuvan.busbooking.auth.repository.OtpVerificationRepository;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.common.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final int expiryMinutes;
    private final int maxAttempts;

    public OtpService(
            OtpVerificationRepository otpRepository,
            UserRepository userRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts
    ) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
    }

    /**
     * Generates a 6-digit OTP for password reset.
     * The user must exist and be ACTIVE (verified). Does NOT require PENDING status.
     */
    @Transactional
    public void generateAndSendPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Account is not active. Please verify your email first.");
        }

        // Expire any existing active PASSWORD_RESET OTP for this email
        otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(
                        email, OtpPurpose.PASSWORD_RESET)
                .filter(existing -> existing.getStatus() == OtpStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(OtpStatus.EXPIRED);
                    otpRepository.save(existing);
                });

        String plainOtp = generateSixDigitOtp();

        OtpVerification record = new OtpVerification();
        record.setEmail(email);
        record.setOtpHash(passwordEncoder.encode(plainOtp));
        record.setPurpose(OtpPurpose.PASSWORD_RESET);
        record.setStatus(OtpStatus.ACTIVE);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        record.setAttempts(0);

        otpRepository.save(record);

        emailService.sendPasswordResetOtp(email, plainOtp, expiryMinutes);
    }

    /**
     * Verifies the OTP submitted for password reset.
     * On success, marks the OTP as VERIFIED (password update is done separately).
     * Returns the verified OtpVerification record so AuthService can confirm it.
     */
    @Transactional(noRollbackFor = OtpVerificationException.class)
    public OtpVerification verifyForPasswordReset(String email, String submittedOtp) {
        OtpVerification record = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(
                        email, OtpPurpose.PASSWORD_RESET)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No reset code found for this email. Please request a new one."));

        if (record.getStatus() == OtpStatus.VERIFIED) {
            throw new IllegalStateException("This reset code has already been used.");
        }

        if (record.getStatus() == OtpStatus.EXPIRED
                || LocalDateTime.now().isAfter(record.getExpiresAt())) {
            record.setStatus(OtpStatus.EXPIRED);
            otpRepository.save(record);
            throw new OtpVerificationException(
                    "The reset code has expired. Please request a new one.");
        }

        if (record.getAttempts() >= maxAttempts) {
            record.setStatus(OtpStatus.EXPIRED);
            otpRepository.save(record);
            throw new OtpVerificationException(
                    "Too many incorrect attempts. Please request a new code.");
        }

        if (!passwordEncoder.matches(submittedOtp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            otpRepository.save(record);

            int remaining = maxAttempts - record.getAttempts();
            throw new OtpVerificationException(
                    "Incorrect code. " + remaining
                            + " attempt" + (remaining == 1 ? "" : "s") + " remaining.");
        }

        // Mark verified
        record.setStatus(OtpStatus.VERIFIED);
        record.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(record);

        return record;
    }

    /**
     * Generates a 6-digit OTP, persists its BCrypt hash, and emails it.
     * Any previous ACTIVE OTP for this email + purpose is invalidated first.
     */
    @Transactional
    public void generateAndSend(String email, OtpPurpose purpose) {
        
        User user = getUser(email);

        if (!user.getTwitterEmailPending() && user.getStatus() == UserStatus.ACTIVE) {
            throw new IllegalStateException("Email is already verified");
        }

        // Expire any existing active OTP for this email + purpose
        otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .filter(existing -> existing.getStatus() == OtpStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(OtpStatus.EXPIRED);
                    otpRepository.save(existing);
                });

        String plainOtp = generateSixDigitOtp();

        OtpVerification record = new OtpVerification();
        record.setEmail(email);
        record.setOtpHash(passwordEncoder.encode(plainOtp));
        record.setPurpose(purpose);
        record.setStatus(OtpStatus.ACTIVE);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        record.setAttempts(0);

        otpRepository.save(record);

        emailService.sendOtp(email, plainOtp, expiryMinutes);
    }

    /**
     * Generates and sends OTP for TOTP login fallback.
     * Used when user's authenticator app is unavailable.
     * No verification status check - works for any verified user with TOTP enabled.
     */
    @Transactional
    public void generateAndSendTotpLoginFallback(String email) {

        // Expire any existing active OTP for this email + purpose
        otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, OtpPurpose.TOTP_LOGIN_FALLBACK)
                .filter(existing -> existing.getStatus() == OtpStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(OtpStatus.EXPIRED);
                    otpRepository.save(existing);
                });

        String plainOtp = generateSixDigitOtp();

        OtpVerification record = new OtpVerification();
        record.setEmail(email);
        record.setOtpHash(passwordEncoder.encode(plainOtp));
        record.setPurpose(OtpPurpose.TOTP_LOGIN_FALLBACK);
        record.setStatus(OtpStatus.ACTIVE);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        record.setAttempts(0);

        otpRepository.save(record);

        emailService.sendOtp(email, plainOtp, expiryMinutes);
    }

    /**
     * Verifies the submitted OTP against the latest record for this email + purpose.
     * For REGISTRATION purpose: Returns tempToken for TOTP setup (does NOT activate user yet)
     * For other purposes: Activates user immediately
     */
    @Transactional(noRollbackFor = OtpVerificationException.class)
    public String verify(String email, String submittedOtp, OtpPurpose purpose) {
        OtpVerification record = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No verification code found for this email. Please request a new one."));

        System.out.println("Record found: " + record);
        if (record.getStatus() == OtpStatus.VERIFIED) {
            throw new IllegalStateException("Email is already verified.");
        }

        if (record.getStatus() == OtpStatus.EXPIRED
                || LocalDateTime.now().isAfter(record.getExpiresAt())) {
            record.setStatus(OtpStatus.EXPIRED);
            System.out.println("Record Expired: " + record);
            otpRepository.save(record);
            throw new OtpVerificationException(
                    "The verification code has expired. Please request a new one.");
        }

        if (record.getAttempts() >= maxAttempts) {
            record.setStatus(OtpStatus.EXPIRED);
            otpRepository.save(record);
            throw new OtpVerificationException(
                    "Too many incorrect attempts. Please request a new code.");
        }

        if (!passwordEncoder.matches(submittedOtp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            otpRepository.save(record);

            int remaining = maxAttempts - record.getAttempts();
            throw new OtpVerificationException(
                    "Incorrect code. " + remaining
                            + " attempt" + (remaining == 1 ? "" : "s") + " remaining.");
        }

        // Correct — mark verified
        record.setStatus(OtpStatus.VERIFIED);
        record.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(record);

        User user = getUser(email);

        // Activate user immediately after OTP verification
        // TOTP 2FA setup is now optional and done from profile page
        user.setStatus(UserStatus.ACTIVE);
        user.setOnboardingCompleted(true);
        userRepository.save(user);
        
        return null;
    }

    private String generateSixDigitOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private User getUser(String email) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();

        User user;
        
        if(currentEmail.startsWith("twitter"))
            user = userRepository.findByEmail(currentEmail)
                            .orElseThrow(
                                () -> new ResourceNotFoundException(
                                    "User not found with email " + currentEmail
                                )
                            );
        else
            user = userRepository.findByEmail(email)
                            .orElseThrow(
                                () -> new ResourceNotFoundException(
                                    "User not found with email " + email
                                )
                            );
        return user;
    }
}
