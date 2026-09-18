package com.yuvan.busbooking.auth.dto;

/**
 * Response returned by {@code GET /api/v1/auth/twitter/authorize}.
 *
 * <p>The frontend must redirect (or open a popup) to {@code authorizeUrl}.
 * The {@code state} value is an opaque token that the frontend should send back
 * verbatim in the callback request so the backend can validate it.</p>
 *
 * @param authorizeUrl Full Twitter authorization URL including all PKCE and scope params.
 * @param state        Opaque CSRF-protection token — include this in the callback request.
 */
public record TwitterAuthorizeResponse(
        String authorizeUrl,
        String state
) {}
