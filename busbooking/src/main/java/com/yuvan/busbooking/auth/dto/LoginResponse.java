package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response object for authentication endpoints.
 * onboardingRequired is optional and only included for Google OAuth users who need onboarding.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    @JsonProperty("accessToken")
    private final String accessToken;

    @JsonProperty("tokenType")
    private final String tokenType;

    @JsonProperty("expiresIn")
    private final long expiresIn;

    @JsonProperty("onboardingRequired")
    private final Boolean onboardingRequired;

    // Constructor for standard login (3 params)
    public LoginResponse(String accessToken, String tokenType, long expiresIn) {
        this(accessToken, tokenType, expiresIn, null);
    }

    // Constructor for Google OAuth with onboarding flag (4 params)
    public LoginResponse(String accessToken, String tokenType, long expiresIn, Boolean onboardingRequired) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.onboardingRequired = onboardingRequired;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public Boolean getOnboardingRequired() {
        return onboardingRequired;
    }
}