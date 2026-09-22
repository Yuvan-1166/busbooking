package com.yuvan.busbooking.auth.totpalternative;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.SecureRandom;

/**
 * Base class for {@link AlternativeOtpChannel} implementations.
 * <p>Provides shared helpers for OTP generation, hashing, recipient masking and
 * common send-response building.</p>
 */
@RequiredArgsConstructor
public abstract class AbstractAlternativeOtpChannel implements AlternativeOtpChannel {

    private static final SecureRandom RANDOM = new SecureRandom();

    protected final PasswordEncoder passwordEncoder;

    @Value("${totp.alternative.otp.ttl:300}") // 5 minutes default
    protected int otpTtlSeconds;

    /**
     * Generates a random 6-digit OTP code.
     */
    protected String generateOtpCode() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    /**
     * Hashes an OTP code for secure storage.
     */
    protected String generateOtpHash(String code) {
        return passwordEncoder.encode(code);
    }

    /**
     * Masks a mobile number for logging/display.
     */
    protected String maskMobileNumber(String mobileNumber) {
        if (mobileNumber == null || mobileNumber.length() < 4) {
            return "****";
        }
        return "****" + mobileNumber.substring(Math.max(0, mobileNumber.length() - 4));
    }

    /**
     * Masks an email address for logging/display.
     */
    protected String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "****";
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 1) {
            return "****@" + email.substring(atIndex + 1);
        }
        String localPart = email.substring(0, 1) + "***";
        return localPart + "@" + email.substring(atIndex + 1);
    }

    /**
     * Builds the standard send response for a persisted OTP session.
     */
    protected TotpAlternativeOtpResponse buildSendResponse(
            TotpAlternativeOtp savedOtp,
            String message,
            String maskedRecipient,
            String externalVerificationId
    ) {
        return TotpAlternativeOtpResponse.builder()
                .message(message)
                .method(savedOtp.getMethod())
                .sessionId(savedOtp.getId().toString())
                .maskedRecipient(maskedRecipient)
                .expiresIn(otpTtlSeconds)
                .externalVerificationId(externalVerificationId)
                .build();
    }
}