package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.yuvan.busbooking.auth.oauth.OAuthProviderType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OAuthAuthorizeResponse(
        OAuthProviderType provider,
        String authorizeUrl,
        String state
) {}