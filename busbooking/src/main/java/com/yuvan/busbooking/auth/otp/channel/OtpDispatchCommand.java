package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.auth.entity.OtpPurpose;

/**
 * Everything a channel needs in order to deliver a single OTP.
 *
 * @param target        the canonical destination (email address, mobile number, …).
 * @param code          the plaintext code, {@code null} when the provider
 *                      issues the code itself.
 * @param purpose       why the code is being issued, used to pick the right
 *                      message template.
 * @param expiryMinutes how long the code stays valid.
 */
public record OtpDispatchCommand(
        String target,
        String code,
        OtpPurpose purpose,
        int expiryMinutes
) {

    /**
     * Command for a code this application generated and hashed itself.
     */
    public static OtpDispatchCommand locallyIssued(
            String target,
            String code,
            OtpPurpose purpose,
            int expiryMinutes
    ) {
        return new OtpDispatchCommand(target, code, purpose, expiryMinutes);
    }

    /**
     * Command for a code the channel provider generates and validates itself.
     */
    public static OtpDispatchCommand providerIssued(
            String target,
            OtpPurpose purpose,
            int expiryMinutes
    ) {
        return new OtpDispatchCommand(target, null, purpose, expiryMinutes);
    }

    /**
     * @return {@code true} when this command carries a code generated locally.
     */
    public boolean hasCode() {
        return code != null;
    }
}
