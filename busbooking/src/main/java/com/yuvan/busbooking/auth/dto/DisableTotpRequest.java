package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to disable 2FA (requires password confirmation)
 */
public record DisableTotpRequest(
        @NotBlank(message = "Password is required")
        String password
) {
}
