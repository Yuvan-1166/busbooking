package com.yuvan.busbooking.auth.dto;

import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code POST /api/v1/auth/oauth/callback}.
 *
 * <p>A single polymorphic payload that each provider interprets differently:</p>
 * <ul>
 *   <li><b>GOOGLE</b> – expects {@code idToken} (Identity token from the client).</li>
 *   <li><b>TWITTER</b> – expects {@code code} and {@code state} (authorization
 *       code flow with PKCE; the state must match the one issued at authorize).</li>
 * </ul>
 *
 * @param provider The OAuth identity provider.
 * @param userType "PASSENGER" or "OPERATOR".
 * @param idToken  Provider-issued identity token (Google).
 * @param code     Authorization code from the provider's redirect (Twitter).
 * @param state    Opaque CSRF token issued at authorize (Twitter).
 */
public record OAuthCallbackRequest(
        @NotNull(message = "Provider is required (GOOGLE or TWITTER)")
        OAuthProviderType provider,

        @NotBlank(message = "User type is required (PASSENGER or OPERATOR)")
        String userType,

        String idToken,
        String code,
        String state
) {}