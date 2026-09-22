package com.yuvan.busbooking.auth.otp;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * OTP flow for {@code TOTP_LOGIN_FALLBACK}, used when a user's authenticator
 * app is unavailable.
 * <p>No verification-status precondition applies — any verified user with TOTP
 * enabled may use it (eligibility is checked by the caller). No post-verification
 * mutation is applied since the user is already ACTIVE.</p>
 */
@Component
@RequiredArgsConstructor
public class TotpLoginFallbackOtpFlow implements OtpFlow {

    private final EmailService emailService;

    @Override
    public OtpPurpose getPurpose() {
        return OtpPurpose.TOTP_LOGIN_FALLBACK;
    }

    @Override
    public void validateForSend(User user) {
        // No-op: any user reaching this flow is eligible.
    }

    @Override
    public void deliver(String email, String plainOtp, int expiryMinutes) {
        emailService.sendOtp(email, plainOtp, expiryMinutes);
    }

    @Override
    public void applyPostVerification(User user) {
        // No-op: the user is already ACTIVE with TOTP configured.
    }
}