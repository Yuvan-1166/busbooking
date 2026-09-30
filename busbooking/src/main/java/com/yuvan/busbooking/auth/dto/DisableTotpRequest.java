package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to disable 2FA (requires password confirmation)
 */
public record DisableTotpRequest(
        @NotBlank(message = "Password is required")
        @JsonDeserialize(using = Base64Deserializer.class)
        String password
) {
}
