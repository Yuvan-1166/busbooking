package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;
import com.yuvan.busbooking.auth.oauth.OAuthProvider;
import com.yuvan.busbooking.auth.oauth.OAuthProviderFactory;
import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import org.springframework.stereotype.Service;

/**
 * Facade that exposes the OAuth orchestration API. It resolves the
 * {@link OAuthProvider} for the requested type via {@link OAuthProviderFactory}
 * and delegates the provider-specific steps to it.
 */
@Service
public class OAuthService {

    private final OAuthProviderFactory providerFactory;

    public OAuthService(OAuthProviderFactory providerFactory) {
        this.providerFactory = providerFactory;
    }

    /**
     * Starts the authorization flow for the given provider.
     */
    public OAuthAuthorizeResponse authorize(OAuthProviderType provider) {
        return resolve(provider).authorize();
    }

    /**
     * Completes the authorization flow for the provider identified by the request.
     */
    public LoginResponse handleCallback(OAuthCallbackRequest request) {
        return resolve(request.provider()).handleCallback(request);
    }

    private OAuthProvider resolve(OAuthProviderType provider) {
        return providerFactory.getProvider(provider);
    }
}