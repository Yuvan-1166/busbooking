package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.user.entity.User;

public interface OtpFlow {

    OtpPurpose getPurpose();

    void validateForSend(User user);

    void applyPostVerification(User user);
}
