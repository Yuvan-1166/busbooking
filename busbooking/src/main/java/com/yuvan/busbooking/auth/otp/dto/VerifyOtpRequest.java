package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;


public record VerifyOtpRequest(

        @NotBlank(message = "A destination is required")
        @JsonAlias({"email", "mobile", "mobileNumber", "phone"})
        String target,

        @NotBlank(message = "A verification code is required")
        @JsonDeserialize (using = Base64Deserializer.class)
        @Pattern(
            regexp = "\\d{4,8}",
            message = "The verification code must be 4 to 8 digits"
        )
        String otp,

        OtpChannelType channel,

        OtpPurpose purpose
) {

    public OtpChannelType resolvedChannel() {
        return channel == null ? OtpChannelType.EMAIL : channel;
    }

    public OtpPurpose resolvedPurpose() {
        return purpose == null ? OtpPurpose.REGISTRATION : purpose;
    }

    public static VerifyOtpRequest forEmail(
            String email,
            OtpPurpose purpose,
            String otp
    ) {
        return new VerifyOtpRequest(email, otp, OtpChannelType.EMAIL, purpose);
    }
}
