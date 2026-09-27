package com.yuvan.busbooking.auth.otp.channel;

/**
 * Delivery methods supported by the unified OTP flow.
 *
 * <p>Adding a constant here is all that is required on the API surface — the
 * matching {@link OtpChannel} bean is picked up automatically by
 * {@link OtpChannelFactory} and becomes usable through
 * {@code /api/v1/auth/verify/send} and {@code /api/v1/auth/verify/confirm}
 * without touching the controller or the service.</p>
 */
public enum OtpChannelType {
    EMAIL,
    MOBILE
}
