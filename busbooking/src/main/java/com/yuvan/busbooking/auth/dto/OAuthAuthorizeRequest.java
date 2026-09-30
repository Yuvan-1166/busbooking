package com.yuvan.busbooking.auth.dto;

import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import jakarta.validation.constraints.NotNull;

public record OAuthAuthorizeRequest(
        @NotNull(message = "Provider is required (GOOGLE or TWITTER)")
        OAuthProviderType provider
) {}