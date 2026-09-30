package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.user.entity.User;

public interface OtpFlow {

    OtpPurpose getPurpose();

    /**
     * A flow may only be completed over a channel that actually proves
     * ownership of the identity it is about to change. Verifying a mobile
     * number over EMAIL, for example, would prove nothing about the phone, so
     * such flows narrow this instead of trusting the request.
     */
    default boolean supportsChannel(OtpChannelType channel) {
        return true;
    }

    void validateForSend(User user);

    void applyPostVerification(User user);
}
