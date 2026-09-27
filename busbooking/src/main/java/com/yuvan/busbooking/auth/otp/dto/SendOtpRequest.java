package com.yuvan.busbooking.auth.otp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.validation.constraints.NotBlank;

/**
 * Request to send (or resend) a one-time password.
 *
 * <p>The same payload serves every delivery method: {@code target} is an email
 * address or a mobile number depending on {@code channel}, and the channel
 * itself decides how to interpret and deliver it. The {@code email} /
 * {@code mobile} aliases keep older clients working unchanged.</p>
 *
 * @param target  the destination to deliver the code to.
 * @param channel the delivery method, defaults to {@link OtpChannelType#EMAIL}.
 * @param purpose why the code is issued, defaults to
 *                {@link OtpPurpose#REGISTRATION}.
 */
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
