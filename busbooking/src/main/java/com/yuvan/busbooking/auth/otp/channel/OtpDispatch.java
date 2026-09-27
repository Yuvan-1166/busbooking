package com.yuvan.busbooking.auth.otp.channel;

/**
 * Outcome of handing an OTP to a channel.
 *
 * @param externalReference the handle the provider uses to validate the code
 *                          later (e.g. a Message Central verification id), or
 *                          {@code null} when the code is issued and verified by
 *                          this application.
 */
public record OtpDispatch(String externalReference) {

    /**
     * Dispatch of a code this application issued and will verify itself.
     */
    public static OtpDispatch local() {
        return new OtpDispatch(null);
    }

    /**
     * Dispatch of a code the provider issued and will verify.
     *
     * @throws IllegalStateException if the provider returned no reference.
     */
    public static OtpDispatch external(String reference) {
        if (reference == null || reference.isBlank()) {
            throw new IllegalStateException(
                    "The OTP provider did not return a verification reference");
        }
        return new OtpDispatch(reference);
    }
}
