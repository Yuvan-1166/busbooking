package com.yuvan.busbooking.auth.dto;

import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code POST /api/v1/auth/oauth/authorize}.
 *
 * @param provider The OAuth identity provider to start the flow for.
 */
public record OAuthAuthorizeRequest(
        @NotNull(message = "Provider is required (GOOGLE or TWITTER)")
        OAuthProviderType provider
) {}