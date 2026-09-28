package com.yuvan.busbooking.auth.oauth;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OAuthAuthorizeResponse;
import com.yuvan.busbooking.auth.dto.OAuthCallbackRequest;


public interface OAuthProvider {

    OAuthProviderType getType();

    OAuthAuthorizeResponse authorize();

    LoginResponse handleCallback(OAuthCallbackRequest request);
}