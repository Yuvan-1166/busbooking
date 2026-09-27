package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import org.springframework.stereotype.Component;

/**
 * OTP flow for email verification during {@code REGISTRATION}.
 * <p>Eligible once the account exists but is not yet active — or while a
 * Twitter sign-up is still adding its email address. A successful
 * verification activates the account and completes onboarding.</p>
 */
@Component
public class RegistrationOtpFlow implements OtpFlow {

    @Override
    public OtpPurpose getPurpose() {
        return OtpPurpose.REGISTRATION;
    }

    @Override
    public void validateForSend(User user) {
        if (!user.getTwitterEmailPending() && user.getStatus() == UserStatus.ACTIVE) {
            throw new IllegalStateException("Email is already verified");
        }
    }

    @Override
    public void applyPostVerification(User user) {
        user.setStatus(UserStatus.ACTIVE);
        user.setOnboardingCompleted(true);
    }
}
