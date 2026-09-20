package com.yuvan.busbooking.auth.oauth;

/**
 * Identifies a supported OAuth identity provider.
 *
 * <p>Adding a new provider only requires a new enum constant plus an
 * {@link OAuthProvider} bean that implements the flow.</p>
 */
public enum OAuthProviderType {
    GOOGLE,
    TWITTER
}