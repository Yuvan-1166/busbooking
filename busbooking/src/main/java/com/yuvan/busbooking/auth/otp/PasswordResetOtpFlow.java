package com.yuvan.busbooking.auth.otp;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * OTP flow for {@code PASSWORD_RESET}.
 * <p>The user must be ACTIVE, and reset codes are delivered via the dedicated
 * password-reset email template. No post-verification mutation is applied —
 * the password update is handled separately by the caller.</p>
 */
@Component
@RequiredArgsConstructor
public class PasswordResetOtpFlow implements OtpFlow {

    private final EmailService emailService;

    @Override
    public OtpPurpose getPurpose() {
        return OtpPurpose.PASSWORD_RESET;
    }

    @Override
    public void validateForSend(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Account is not active. Please verify your email first.");
        }
    }

    @Override
    public void deliver(String email, String plainOtp, int expiryMinutes) {
        emailService.sendPasswordResetOtp(email, plainOtp, expiryMinutes);
    }

    @Override
    public void applyPostVerification(User user) {
        // No-op: password update is handled separately after verification.
    }
}