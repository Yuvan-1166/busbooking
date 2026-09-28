package com.yuvan.busbooking.auth.otp.channel;

public record OtpDispatch(String externalReference) {

    public static OtpDispatch local() {
        return new OtpDispatch(null);
    }

    public static OtpDispatch external(String reference) {
        if (reference == null || reference.isBlank()) {
            throw new IllegalStateException(
                    "The OTP provider did not return a verification reference");
        }
        return new OtpDispatch(reference);
    }
}
