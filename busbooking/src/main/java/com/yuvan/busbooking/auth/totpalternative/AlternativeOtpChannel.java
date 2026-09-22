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

    /**
     * @return the alternative method this channel implements.
     */
    TotpAlternativeType getType();

    /**
     * Sends an OTP to the user via this channel and persists a tracking record.
     *
     * @param user      the user requesting the OTP.
     * @param ipAddress optional IP address for audit.
     * @param userAgent optional user agent for audit.
     * @return response with masked recipient and session ID.
     */
    TotpAlternativeOtpResponse send(User user, String ipAddress, String userAgent);

    /**
     * Validates the submitted code against the given OTP record.
     *
     * @param otp  the persisted OTP session record.
     * @param code the code entered by the user.
     * @return {@code true} if the code is valid for this channel.
     */
    boolean verify(TotpAlternativeOtp otp, String code);
}