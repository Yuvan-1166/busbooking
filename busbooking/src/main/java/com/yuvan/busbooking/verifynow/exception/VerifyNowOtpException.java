package com.yuvan.busbooking.verifynow.exception;

/**
 * Exception thrown when VerifyNow OTP operations fail
 */
public class VerifyNowOtpException extends MessageCentralException {
    
    public VerifyNowOtpException(String message) {
        super(message);
    }
    
    public VerifyNowOtpException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public VerifyNowOtpException(Integer responseCode, String message) {
        super(responseCode, message);
    }
    
    public VerifyNowOtpException(Integer responseCode, String message, Throwable cause) {
        super(responseCode, message, cause);
    }
}
