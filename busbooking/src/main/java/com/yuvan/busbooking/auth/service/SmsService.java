package com.yuvan.busbooking.auth.service;

/**
 * Interface for SMS service providers.
 * Allows easy switching between Twilio, AWS SNS, or other providers.
 */
public interface SmsService {
    
    /**
     * Send OTP via SMS to the specified phone number
     * @param toPhoneNumber Phone number in E.164 format (e.g., +919876543210)
     * @param otp The OTP code to send
     * @param expiryMinutes How long the OTP is valid
     */
    void sendOtp(String toPhoneNumber, String otp, int expiryMinutes);
    
    /**
     * Send a generic SMS (for future use)
     * @param toPhoneNumber Phone number in E.164 format
     * @param message The message to send
     */
    default void sendMessage(String toPhoneNumber, String message) {
        throw new UnsupportedOperationException("Generic SMS sending not supported by this provider");
    }
}
