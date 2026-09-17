package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO when alternative OTP is sent successfully
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TotpAlternativeOtpResponse {
    
    private String message;
    
    private TotpAlternativeType method;
    
    /**
     * Unique identifier for this OTP session
     * Used in verification request
     */
    private String sessionId;
    
    /**
     * Masked recipient (e.g., "****1234" for phone, "u***@example.com" for email)
     */
    private String maskedRecipient;
    
    /**
     * TTL in seconds for OTP validity
     */
    private Integer expiresIn;
    
    /**
     * External verification ID (from VerifyNow for SMS)
     * May be null for email-based OTPs
     */
    private String externalVerificationId;
}
