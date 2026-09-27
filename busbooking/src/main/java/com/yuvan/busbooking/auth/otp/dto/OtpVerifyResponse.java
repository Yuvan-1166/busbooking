package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;

/**
 * Outcome of a send or confirm request.
 *
 * @param message           human readable outcome.
 * @param tempToken         reserved for flows that hand back a short-lived token.
 * @param channel           the delivery method that handled the request.
 * @param purpose           why the code was issued.
 * @param expiresInMinutes  the validity window of the issued code.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpVerifyResponse(
        String message,
        String tempToken,
        String channel,
        String purpose,
        Integer expiresInMinutes
) {

    public static OtpVerifyResponse of(
            String message,
            OtpChannelType channel,
            OtpPurpose purpose,
            int expiresInMinutes
    ) {
        return new OtpVerifyResponse(
                message,
                null,
                channel.name(),
                purpose.name(),
                expiresInMinutes
        );
    }

    // Constructor for simple message response (no channel details)
    public OtpVerifyResponse(String message) {
        this(message, null, null, null, null);
    }
}
