package com.yuvan.busbooking.auth.dto;

import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record OAuthCallbackRequest(
        @NotNull(message = "Provider is required (GOOGLE or TWITTER)")
        OAuthProviderType provider,

        @NotBlank(message = "User type is required (PASSENGER or OPERATOR)")
        String userType,

        String idToken,
        String code,
        String state
) {}