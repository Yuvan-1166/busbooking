package com.yuvan.busbooking.auth.oauth;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;

/**
 * Strategy that encapsulates the complete OAuth 2.x sign-in flow for one
 * identity provider (Step 1: build authorization URL; Step 2: exchange the
 * provider's callback for a local {@link LoginResponse}).
 *
 * <p>Implementations are Spring beans discovered automatically by
 * {@link OAuthProviderFactory} keyed on {@link #getType()}. Adding support for
 * a new provider is a single new bean with zero changes to the controller,
 * facade, or factory.</p>
 */
public interface OAuthProvider {

    /**
     * @return the provider this strategy implements.
     */
    OAuthProviderType getType();

    /**
     * Step 1 – generates the provider authorization URL (and any CSRF state).
     *
     * <p>Providers whose authorization runs entirely on the client (e.g. Google)
     * return a response with {@code null} URL/state; the client should then skip
     * the redirect and call {@link #handleCallback} directly.</p>
     *
     * @return the authorization URL and state token (fields may be {@code null}).
     */
    OAuthAuthorizeResponse authorize();

    /**
     * Step 2 – validates the provider callback, creates or updates the local
     * user record, and issues a JWT.
     *
     * @param request provider-specific callback payload.
     * @return a login response (JWT, plus onboarding flags for new users).
     */
    LoginResponse handleCallback(OAuthCallbackRequest request);
}