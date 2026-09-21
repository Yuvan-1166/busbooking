package com.yuvan.busbooking.payment.gateway.razorpay;

/**
 * Thrown when the Razorpay API rejects or fails a request.
 * Surfaced by the global exception handler as a 500; callers treat it as a
 * transient/provider failure rather than a client-side rejection.
 */
public class RazorpayApiException extends RuntimeException {

    public RazorpayApiException(String message) {
        super(message);
    }

    public RazorpayApiException(String message, Throwable cause) {
        super(message, cause);
    }
}