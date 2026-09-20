package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yuvan.busbooking.auth.oauth.OAuthProviderType;

/**
 * Response for {@code POST /api/v1/auth/oauth/authorize}.
 *
 * <p>The client redirects the browser to {@code authorizeUrl}. The {@code state}
 * value is an opaque CSRF token that must be sent back verbatim in the callback
 * request. Providers whose authorization step runs entirely on the client
 * (e.g. Google) return {@code null} for both fields, in which case the client
 * may skip the redirect and go straight to {@code /oauth/callback}.</p>
 *
 * @param provider     The provider this response was generated for.
 * @param authorizeUrl Full provider authorization URL (may be {@code null}).
 * @param state        Opaque CSRF-protection token (may be {@code null}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OAuthAuthorizeResponse(
        OAuthProviderType provider,
        String authorizeUrl,
        String state
) {}