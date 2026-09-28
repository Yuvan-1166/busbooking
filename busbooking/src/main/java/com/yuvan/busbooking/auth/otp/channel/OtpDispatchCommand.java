package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.auth.entity.OtpPurpose;

public record OtpDispatchCommand(
        String target,
        String code,
        OtpPurpose purpose,
        int expiryMinutes
) {

    public static OtpDispatchCommand locallyIssued(
            String target,
            String code,
            OtpPurpose purpose,
            int expiryMinutes
    ) {
        return new OtpDispatchCommand(target, code, purpose, expiryMinutes);
    }

    public static OtpDispatchCommand providerIssued(
            String target,
            OtpPurpose purpose,
            int expiryMinutes
    ) {
        return new OtpDispatchCommand(target, null, purpose, expiryMinutes);
    }

    public boolean hasCode() {
        return code != null;
    }
}
