package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;
import com.yuvan.busbooking.auth.oauth.OAuthProvider;
import com.yuvan.busbooking.auth.oauth.OAuthProviderFactory;
import com.yuvan.busbooking.auth.oauth.OAuthProviderType;
import org.springframework.stereotype.Service;

@Service
public class OAuthService {

    private final OAuthProviderFactory providerFactory;

    public OAuthService(OAuthProviderFactory providerFactory) {
        this.providerFactory = providerFactory;
    }

    public OAuthAuthorizeResponse authorize(OAuthProviderType provider) {
        return resolve(provider).authorize();
    }

    public LoginResponse handleCallback(OAuthCallbackRequest request) {
        return resolve(request.provider()).handleCallback(request);
    }

    private OAuthProvider resolve(OAuthProviderType provider) {
        return providerFactory.getProvider(provider);
    }
}