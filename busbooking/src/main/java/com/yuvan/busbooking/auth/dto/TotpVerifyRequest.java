package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify TOTP code during login
 */
public record TotpVerifyRequest(
        @NotBlank(message = "Temporary token is required")
        String tempToken,

        @NotBlank(message = "TOTP code is required")
        String totpCode,

        String ipAddress,
        String userAgent
) {
}
