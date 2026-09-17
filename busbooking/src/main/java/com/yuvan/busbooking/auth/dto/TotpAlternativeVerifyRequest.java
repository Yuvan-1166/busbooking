package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;

/**
 * Request DTO for verifying alternative OTP (SMS, Email, etc.) during login
 */
public record TotpAlternativeVerifyRequest(
    @NotBlank(message = "Temporary token is required")
    String tempToken,
    
    @NotBlank(message = "Session ID is required")
    String sessionId,
    
    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{4,6}$", message = "OTP must be 4-6 digits")
    String code
) {}
