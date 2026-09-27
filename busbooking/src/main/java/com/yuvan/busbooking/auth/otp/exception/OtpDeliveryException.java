package com.yuvan.busbooking.auth.otp.exception;

/**
 * Thrown when a channel cannot hand the OTP to its underlying transport
 * (SMTP, SMS gateway, …).
 *
 * <p>Kept separate from the verification errors so the API can answer with an
 * "we could not deliver it" status instead of a "your code is wrong" one.</p>
 */
public class OtpDeliveryException extends RuntimeException {

    public OtpDeliveryException(String message) {
        super(message);
    }

    public OtpDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
