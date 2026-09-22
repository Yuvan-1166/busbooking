package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.OtpVerification;
import com.yuvan.busbooking.auth.otp.OtpFlow;
import com.yuvan.busbooking.auth.otp.OtpFlowFactory;
import com.yuvan.busbooking.auth.repository.OtpVerificationRepository;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Service for issuing and verifying email OTPs.
 * <p>
 * Acts as a facade over the {@link OtpFlow} strategies, providing the
 * purpose-agnostic orchestration: storage, hashing, expiry, attempt limits
 * and code matching. Purpose-specific behavior (eligibility, delivery,
 * post-verification side effects) is delegated to the flow for the requested
 * {@link OtpPurpose}.
 * </p>
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpFlowFactory flowFactory;
    private final int expiryMinutes;
    private final int maxAttempts;

    public OtpService(
            OtpVerificationRepository otpRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            OtpFlowFactory flowFactory,
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts
    ) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.flowFactory = flowFactory;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
    }

    /**
     * Generates a 6-digit OTP for password reset.
     * The user must exist and be ACTIVE (verified). Does NOT require PENDING status.
     */
    @Transactional
    public void generateAndSendPasswordReset(String email) {
        issue(email, flowFactory.getFlow(OtpPurpose.PASSWORD_RESET));
    }

    /**
     * Verifies the OTP submitted for password reset.
     * On success, marks the OTP as VERIFIED (password update is done separately).
     * Returns the verified OtpVerification record so AuthService can confirm it.
     */
    @Transactional(noRollbackFor = OtpVerificationException.class)
    public OtpVerification verifyForPasswordReset(String email, String submittedOtp) {
        return verifyCore(
                email, submittedOtp, OtpPurpose.PASSWORD_RESET,
                "No reset code found for this email. Please request a new one.");
    }

    /**
     * Generates a 6-digit OTP, persists its BCrypt hash, and emails it.
     * Any previous ACTIVE OTP for this email + purpose is invalidated first.
     */
    @Transactional
    public void generateAndSend(String email, OtpPurpose purpose) {
        issue(email, flowFactory.getFlow(purpose));
    }

    /**
     * Generates and sends OTP for TOTP login fallback.
     * Used when user's authenticator app is unavailable.
     */
    @Transactional
    public void generateAndSendTotpLoginFallback(String email) {
        issue(email, flowFactory.getFlow(OtpPurpose.TOTP_LOGIN_FALLBACK));
    }

    /**
     * Verifies the submitted OTP against the latest record for this email + purpose
     * and applies the purpose-specific post-verification side effects.
     */
    @Transactional(noRollbackFor = OtpVerificationException.class)
    public String verify(String email, String submittedOtp, OtpPurpose purpose) {
        verifyCore(
                email, submittedOtp, purpose,
                "No verification code found for this email. Please request a new one.");

        User user = getUser(email);
        OtpFlow flow = flowFactory.getFlow(purpose);
        flow.applyPostVerification(user);
        userRepository.save(user);

        return null;
    }

    /**
     * Issues a new OTP for the given flow: validates eligibility, invalidates any
     * previous ACTIVE OTP, persists the hashed code and delivers it.
     */
    private void issue(String email, OtpFlow flow) {
        User user = getUser(email);

        flow.validateForSend(user);

        expireExisting(email, flow.getPurpose());

        String plainOtp = generateSixDigitOtp();

        OtpVerification record = new OtpVerification();
        record.setEmail(email);
        record.setOtpHash(passwordEncoder.encode(plainOtp));
        record.setPurpose(flow.getPurpose());
        record.setStatus(OtpStatus.ACTIVE);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        record.setAttempts(0);

        otpRepository.save(record);

        flow.deliver(email, plainOtp, expiryMinutes);
    }

    /**
     * Loads the latest OTP record for the purpose and validates the submitted code.
     */
    private OtpVerification verifyCore(
            String email,
            String submittedOtp,
            OtpPurpose purpose,
            String notFoundMessage
    ) {
        OtpVerification record = otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new IllegalArgumentException(notFoundMessage));

        if (record.getStatus() == OtpStatus.VERIFIED) {
            throw new IllegalStateException("This verification code has already been used.");
        }

        if (record.getStatus() == OtpStatus.EXPIRED
                || LocalDateTime.now().isAfter(record.getExpiresAt())) {
            record.setStatus(OtpStatus.EXPIRED);
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

        return record;
    }

    /**
     * Invalidates any existing ACTIVE OTP for this email + purpose.
     */
    private void expireExisting(String email, OtpPurpose purpose) {
        otpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .filter(existing -> existing.getStatus() == OtpStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(OtpStatus.EXPIRED);
                    otpRepository.save(existing);
                });
    }

    private String generateSixDigitOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private User getUser(String email) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();

        User user;

        if (currentEmail.startsWith("twitter"))
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