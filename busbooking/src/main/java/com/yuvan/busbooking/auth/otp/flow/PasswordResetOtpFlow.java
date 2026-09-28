package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import org.springframework.stereotype.Component;


@Component
public class PasswordResetOtpFlow implements OtpFlow {

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
    public void applyPostVerification(User user) {
        // No-op: the password update is applied separately after verification.
    }
}
