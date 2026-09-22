package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import com.yuvan.busbooking.auth.repository.TotpAlternativeOtpRepository;
import com.yuvan.busbooking.auth.totpalternative.AlternativeOtpChannel;
import com.yuvan.busbooking.auth.totpalternative.AlternativeOtpChannelFactory;
import com.yuvan.busbooking.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing TOTP alternative authentication methods.
 * <p>
 * Acts as a facade over the {@link AlternativeOtpChannel} strategies, providing
 * the channel-agnostic orchestration: rate limiting, session ownership checks,
 * expiry/attempt guardrails and status transitions.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TotpAlternativeService {

    private final TotpAlternativeOtpRepository alternativeOtpRepository;
    private final AlternativeOtpChannelFactory channelFactory;

    @Value("${totp.alternative.max-attempts:5}")
    private int maxAttempts;

    @Value("${totp.alternative.rate-limit-minutes:15}")
    private int rateLimitMinutes;

    /**
     * Send alternative OTP to user via specified method.
     *
     * @param user      User entity
     * @param method    Alternative method (SMS, EMAIL, etc.)
     * @param ipAddress Optional IP address for audit
     * @param userAgent Optional user agent for audit
     * @return Response with masked recipient and session ID
     * @throws IllegalArgumentException if method not supported or user doesn't have required contact info
     */
    public TotpAlternativeOtpResponse sendAlternativeOtp(
            User user,
            TotpAlternativeType method,
            String ipAddress,
            String userAgent
    ) {
        log.info("Sending alternative OTP via {} for user: {}", method, user.getId());

        checkRateLimit(user.getId(), method);

        return channelFactory.getChannel(method).send(user, ipAddress, userAgent);
    }

    /**
     * Verify alternative OTP code.
     *
     * @param user      User entity
     * @param sessionId OTP session ID from send response
     * @param code      OTP code entered by user
     * @param ipAddress Optional IP address for audit
     * @param userAgent Optional user agent for audit
     * @return true if verification successful, false otherwise
     */
    public boolean verifyAlternativeOtp(
            User user,
            Long sessionId,
            String code,
            String ipAddress,
            String userAgent
    ) {
        log.info("Verifying alternative OTP for user {} with session: {}", user.getId(), sessionId);

        TotpAlternativeOtp otp = alternativeOtpRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("OTP session not found"));

        if (!otp.getUser().getId().equals(user.getId())) {
            log.warn("OTP session {} does not belong to user {}", sessionId, user.getId());
            throw new IllegalArgumentException("Invalid OTP session");
        }

        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            log.warn("OTP session {} has expired", sessionId);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            throw new IllegalArgumentException("OTP has expired");
        }

        if (otp.getStatus() == OtpStatus.VERIFIED) {
            log.warn("OTP session {} already verified", sessionId);
            throw new IllegalArgumentException("OTP already used");
        }

        if (otp.getAttemptCount() >= maxAttempts) {
            log.warn("Max attempts exceeded for OTP session {}", sessionId);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            throw new IllegalArgumentException("Too many verification attempts");
        }

        boolean isValid;
        try {
            AlternativeOtpChannel channel = channelFactory.getChannel(otp.getMethod());
            isValid = channel.verify(otp, code);
        } catch (Exception e) {
            log.error("Error during OTP verification: {}", e.getMessage(), e);
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            return false;
        }

        if (isValid) {
            log.info("Alternative OTP verified successfully for user {}", user.getId());
            otp.setStatus(OtpStatus.VERIFIED);
            otp.setVerifiedAt(LocalDateTime.now());
            alternativeOtpRepository.save(otp);
            return true;
        } else {
            log.warn("Alternative OTP verification failed for user {}", user.getId());
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            return false;
        }
    }

    /**
     * Check if user is rate limited for this method.
     */
    private void checkRateLimit(Long userId, TotpAlternativeType method) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(rateLimitMinutes);
        List<TotpAlternativeOtp> recentAttempts = alternativeOtpRepository.findRecentOtpAttempts(
                userId, method, since
        );

        if (recentAttempts.size() >= maxAttempts) {
            log.warn("User {} rate limited for method {}", userId, method);
            throw new IllegalArgumentException(
                    "Too many OTP requests. Please wait " + rateLimitMinutes + " minutes before trying again."
            );
        }
    }
}