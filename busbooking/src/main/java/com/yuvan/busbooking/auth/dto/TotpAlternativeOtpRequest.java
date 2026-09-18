package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;

/**
 * Request DTO for sending alternative OTP during TOTP login fallback
 * Supports SMS, Email, and other methods
 */
public record TotpAlternativeOtpRequest(
    @NotNull(message = "Alternative method is required")
    TotpAlternativeType method,
    
    @NotBlank(message = "Temporary token is required")
    String tempToken
) {}
