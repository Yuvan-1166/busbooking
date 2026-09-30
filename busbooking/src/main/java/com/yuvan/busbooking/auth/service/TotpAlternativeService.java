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