package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
