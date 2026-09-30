package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify TOTP code during login
 */
public record TotpVerifyRequest(
        @NotBlank(message = "Temporary token is required")
        String tempToken,

        @NotBlank(message = "TOTP code is required")
        @JsonDeserialize (using = Base64Deserializer.class)
        String totpCode,

        String ipAddress,
        String userAgent
) {
}
