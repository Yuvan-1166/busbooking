package com.yuvan.busbooking.verifynow.exception;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.yuvan.busbooking.verifynow.dto.ErrorResponse;

/**
 * Global exception handler for VerifyNow controllers
 */
@RestControllerAdvice(basePackages = "com.yuvan.busbooking.verifynow")
public class VerifyNowExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(VerifyNowExceptionHandler.class);
    
    /**
     * Handle Message Central authentication exceptions
     */
    @ExceptionHandler(MessageCentralAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            MessageCentralAuthenticationException ex) {
        
        logger.error("Authentication error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.of(
                ex.getResponseCode() != null ? ex.getResponseCode() : HttpStatus.UNAUTHORIZED.value(),
                ex.getErrorMessage() != null ? ex.getErrorMessage() : "Authentication failed"
        );
        
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(error);
    }
    
    /**
     * Handle VerifyNow OTP exceptions
     */
    @ExceptionHandler(VerifyNowOtpException.class)
    public ResponseEntity<ErrorResponse> handleOtpException(VerifyNowOtpException ex) {
        
        logger.error("OTP operation error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.of(
                ex.getResponseCode() != null ? ex.getResponseCode() : HttpStatus.BAD_REQUEST.value(),
                ex.getErrorMessage() != null ? ex.getErrorMessage() : "OTP operation failed"
        );
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }
    
    /**
     * Handle generic Message Central exceptions
     */
    @ExceptionHandler(MessageCentralException.class)
    public ResponseEntity<ErrorResponse> handleMessageCentralException(
            MessageCentralException ex) {
        
        logger.error("Message Central error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.of(
                ex.getResponseCode() != null ? ex.getResponseCode() : HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getErrorMessage() != null ? ex.getErrorMessage() : "Service error occurred"
        );
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
    
    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex) {
        
        logger.warn("Validation error: {}", ex.getMessage());
        
        List<String> errors = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.add(error.getField() + ": " + error.getDefaultMessage());
        }
        
        ErrorResponse error = ErrorResponse.of("Validation failed", errors);
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }
    
    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred. Please try again later."
        );
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}
