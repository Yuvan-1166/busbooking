package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;


public record SendOtpRequest(

        @NotBlank(message = "A destination is required")
        @JsonAlias({"email", "mobile", "mobileNumber", "phone"})
        String target,

        OtpChannelType channel,

        OtpPurpose purpose
) {

    public OtpChannelType resolvedChannel() {
        return channel == null ? OtpChannelType.EMAIL : channel;
    }

    public OtpPurpose resolvedPurpose() {
        return purpose == null ? OtpPurpose.REGISTRATION : purpose;
    }

    public static SendOtpRequest forEmail(String email, OtpPurpose purpose) {
        return new SendOtpRequest(email, OtpChannelType.EMAIL, purpose);
    }
}
