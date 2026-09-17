package com.yuvan.busbooking.user.exception;

/**
 * Exception thrown when mobile verification operations fail
 */
public class MobileVerificationException extends RuntimeException {
    
    public MobileVerificationException(String message) {
        super(message);
    }
    
    public MobileVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
