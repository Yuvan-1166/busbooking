package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify TOTP code during initial setup
 */
public record TotpVerifySetupRequest(
        @NotBlank(message = "TOTP code is required")
        @JsonDeserialize (using = Base64Deserializer.class)
        String totpCode
) {
}
