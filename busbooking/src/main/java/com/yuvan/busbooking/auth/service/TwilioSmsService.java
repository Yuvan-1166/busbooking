package com.yuvan.busbooking.auth.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Twilio implementation of SMS service.
 * 
 * TRIAL MODE: Uses template name "sms_2fa" as body (Twilio requirement)
 * PRODUCTION: Uses actual custom messages
 */
@Service
public class TwilioSmsService implements SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String fromPhoneNumber;

    @Value("${twilio.trial-mode:true}")
    private boolean trialMode;
    
    private static final String TRIAL_TEMPLATE = "sms_2fa"; // Template name for trial

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
        if (trialMode) {
            System.out.println("⚠️  Twilio TRIAL MODE - using template: " + TRIAL_TEMPLATE);
            System.out.println("⚠️  Fixed OTP for testing: 123456");
        }
    }

    /**
     * Send OTP via SMS.
     * Trial mode: Sends template name "sms_2fa" as body
     * Production: Sends actual message
     */
    @Override
    public void sendOtp(String toPhoneNumber, String otp, int expiryMinutes) {
        try {
            String messageBody;
            
            if (trialMode) {
                // Trial: Just send the template name as body
                messageBody = TRIAL_TEMPLATE;
                System.out.println("Sending SMS to " + toPhoneNumber + " with template: " + TRIAL_TEMPLATE);
            } else {
                // Production: Send actual message
                messageBody = String.format(
                    "Your BusBooking verification code is: %s\n\nThis code will expire in %d minutes.",
                    otp,
                    expiryMinutes
                );
                System.out.println("Sending SMS to " + toPhoneNumber + " with OTP: " + otp);
            }
            
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(fromPhoneNumber),
                    messageBody
            ).create();

            System.out.println("✅ SMS sent successfully. SID: " + message.getSid());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
            throw new RuntimeException("Failed to send SMS verification code. Please try again.", e);
        }
    }

    /**
     * Send generic SMS (not supported in trial mode)
     */
    @Override
    public void sendMessage(String toPhoneNumber, String message) {
        if (trialMode) {
            throw new UnsupportedOperationException("Generic SMS not supported in trial mode.");
        }
        
        try {
            Message twilioMessage = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(fromPhoneNumber),
                    message
            ).create();

            System.out.println("✅ SMS sent successfully. SID: " + twilioMessage.getSid());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
            throw new RuntimeException("Failed to send SMS. Please try again.", e);
        }
    }
}
