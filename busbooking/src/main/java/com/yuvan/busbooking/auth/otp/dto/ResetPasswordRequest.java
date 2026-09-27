package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to finish a password reset.
 *
 * <p>Whichever channel issued the code, the reset is confirmed through the same
 * OTP flow, so the code is checked against the destination and channel it was
 * sent to. The {@code email} alias keeps older clients working unchanged.</p>
 *
 * @param target      the destination the code was sent to.
 * @param otp         the code entered by the user.
 * @param newPassword the password to set.
 * @param channel     the delivery method, defaults to
 *                    {@link OtpChannelType#EMAIL}.
 */
public record ResetPasswordRequest(

        @NotBlank(message = "A destination is required")
        @JsonAlias({"email", "mobile", "mobileNumber", "phone"})
        String target,

        @NotBlank String otp,

        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters")
        String newPassword,

        OtpChannelType channel
) {

    public OtpChannelType resolvedChannel() {
        return channel == null ? OtpChannelType.EMAIL : channel;
    }
}
