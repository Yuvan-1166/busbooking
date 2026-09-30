package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for verifying alternative OTP (SMS, Email, etc.) during login
 */
public record TotpAlternativeVerifyRequest(
    @NotBlank(message = "Temporary token is required")
    String tempToken,
    
    @NotBlank(message = "Session ID is required")
    String sessionId,
    
    @NotBlank(message = "OTP code is required")
    @JsonDeserialize (using = Base64Deserializer.class)
    @Pattern(regexp = "^[0-9]{4,6}$", message = "OTP must be 4-6 digits")
    String code
) {}
