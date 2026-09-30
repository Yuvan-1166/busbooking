package com.yuvan.busbooking.auth.totpalternative;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import com.yuvan.busbooking.user.entity.User;

/**
 * Strategy for a TOTP alternative OTP delivery mechanism.
 * <p>Each implementation owns the full lifecycle of one delivery channel:
 * sending the OTP (and persisting its tracking record) and validating a
 * submitted code against that channel's verification mechanism.</p>
 */
public interface AlternativeOtpChannel {

    TotpAlternativeType getType();

    TotpAlternativeOtpResponse send(User user, String ipAddress, String userAgent);

    boolean verify(TotpAlternativeOtp otp, String code);
}