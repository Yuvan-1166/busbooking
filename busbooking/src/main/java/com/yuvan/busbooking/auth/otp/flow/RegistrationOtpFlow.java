package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import org.springframework.stereotype.Component;

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
