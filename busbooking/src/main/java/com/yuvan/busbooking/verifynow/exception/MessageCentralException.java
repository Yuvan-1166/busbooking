package com.yuvan.busbooking.verifynow.exception;

/**
 * Base exception for Message Central API errors
 */
public class MessageCentralException extends RuntimeException {
    
    private final Integer responseCode;
    private final String errorMessage;
    
    public MessageCentralException(String message) {
        super(message);
        this.responseCode = null;
        this.errorMessage = message;
    }
    
    public MessageCentralException(String message, Throwable cause) {
        super(message, cause);
        this.responseCode = null;
        this.errorMessage = message;
    }
    
    public MessageCentralException(Integer responseCode, String message) {
        super(message);
        this.responseCode = responseCode;
        this.errorMessage = message;
    }
    
    public MessageCentralException(Integer responseCode, String message, Throwable cause) {
        super(message, cause);
        this.responseCode = responseCode;
        this.errorMessage = message;
    }
    
    public Integer getResponseCode() {
        return responseCode;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
}
