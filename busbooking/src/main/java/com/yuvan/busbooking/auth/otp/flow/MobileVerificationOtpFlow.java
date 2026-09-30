package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.user.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;


@Component
public class MobileVerificationOtpFlow implements OtpFlow {

    @Override
    public OtpPurpose getPurpose() {
        return OtpPurpose.MOBILE_VERIFICATION;
    }

    @Override
    public boolean supportsChannel(OtpChannelType channel) {
        return channel == OtpChannelType.MOBILE;
    }

    @Override
    public void validateForSend(User user) {
        if (user.getMobileVerified()) {
            throw new IllegalStateException("Mobile number is already verified");
        }
    }

    @Override
    public void applyPostVerification(User user) {
        user.setMobileVerified(true);
        user.setMobileVerifiedAt(LocalDateTime.now());
    }
}
