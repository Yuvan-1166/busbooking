package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;

/**
 * Request to start a password reset.
 *
 * <p>The destination is an email address or a mobile number depending on
 * {@code channel}, so the same payload works for every delivery method. The
 * {@code email} alias keeps older clients working unchanged.</p>
 *
 * @param target  the destination to send the reset code to.
 * @param channel the delivery method, defaults to {@link OtpChannelType#EMAIL}.
 */
public record ForgotPasswordRequest(

        @NotBlank(message = "A destination is required")
        @JsonAlias({"email", "mobile", "mobileNumber", "phone"})
        String target,

        OtpChannelType channel
) {

    public OtpChannelType resolvedChannel() {
        return channel == null ? OtpChannelType.EMAIL : channel;
    }
}
