package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request to confirm a one-time password.
 *
 * <p>Mirrors {@link SendOtpRequest}: the destination, the code and the
 * delivery method are all that the client needs, whichever channel issued the
 * code.</p>
 *
 * @param target  the destination the code was sent to.
 * @param otp     the code entered by the user.
 * @param channel the delivery method, defaults to {@link OtpChannelType#EMAIL}.
 * @param purpose why the code was issued, defaults to
 *                {@link OtpPurpose#REGISTRATION}.
 */
public record VerifyOtpRequest(

        @NotBlank(message = "A destination is required")
        @JsonAlias({"email", "mobile", "mobileNumber", "phone"})
        String target,

        @NotBlank(message = "A verification code is required")
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
