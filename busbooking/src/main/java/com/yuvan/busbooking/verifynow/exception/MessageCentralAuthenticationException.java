package com.yuvan.busbooking.verifynow.exception;

/**
 * Exception thrown when Message Central authentication fails
 */
public class MessageCentralAuthenticationException extends MessageCentralException {
    
    public MessageCentralAuthenticationException(String message) {
        super(message);
    }
    
    public MessageCentralAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public MessageCentralAuthenticationException(Integer responseCode, String message) {
        super(responseCode, message);
    }
    
    public MessageCentralAuthenticationException(Integer responseCode, String message, Throwable cause) {
        super(responseCode, message, cause);
    }
}
