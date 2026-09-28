package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;


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
