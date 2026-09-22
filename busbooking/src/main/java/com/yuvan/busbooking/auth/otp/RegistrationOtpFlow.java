package com.yuvan.busbooking.auth.otp;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * OTP flow for email verification during {@code REGISTRATION}.
 */
@Component
@RequiredArgsConstructor
public class RegistrationOtpFlow implements OtpFlow {

    private final EmailService emailService;

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
    public void deliver(String email, String plainOtp, int expiryMinutes) {
        emailService.sendOtp(email, plainOtp, expiryMinutes);
    }

    @Override
    public void applyPostVerification(User user) {
        user.setStatus(UserStatus.ACTIVE);
        user.setOnboardingCompleted(true);
    }
}