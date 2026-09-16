package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify TOTP code during initial setup
 */
public record TotpVerifySetupRequest(
        @NotBlank(message = "TOTP code is required")
        String totpCode
) {
}
