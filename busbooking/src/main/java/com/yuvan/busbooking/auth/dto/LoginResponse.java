package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response object for authentication endpoints.
 * - onboardingRequired: optional, for Google OAuth users who need onboarding
 * - requiresTotp: indicates if TOTP verification is needed (returns tempToken)
 * - tempToken: short-lived token for TOTP verification step
 * - userId: user ID when TOTP verification is pending
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    @JsonProperty("accessToken")
    private final String accessToken;

    @JsonProperty("tokenType")
    private final String tokenType;

    @JsonProperty("expiresIn")
    private final Long expiresIn;

    @JsonProperty("onboardingRequired")
    private final Boolean onboardingRequired;

    @JsonProperty("requiresTotp")
    private final Boolean requiresTotp;

    @JsonProperty("tempToken")
    private final String tempToken;

    @JsonProperty("userId")
    private final Long userId;

    // Constructor for standard login (3 params)
    public LoginResponse(String accessToken, String tokenType, long expiresIn) {
        this(accessToken, tokenType, expiresIn, null, null, null, null);
    }

    // Constructor for Google OAuth with onboarding flag (4 params)
    public LoginResponse(String accessToken, String tokenType, long expiresIn, Boolean onboardingRequired) {
        this(accessToken, tokenType, expiresIn, onboardingRequired, null, null, null);
    }

    // Constructor for TOTP pending (requires verification)
    public LoginResponse(Boolean requiresTotp, String tempToken, Long userId) {
        this(null, null, null, null, requiresTotp, tempToken, userId);
    }

    // Full constructor
    public LoginResponse(
            String accessToken,
            String tokenType,
            Long expiresIn,
            Boolean onboardingRequired,
            Boolean requiresTotp,
            String tempToken,
            Long userId
    ) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.onboardingRequired = onboardingRequired;
        this.requiresTotp = requiresTotp;
        this.tempToken = tempToken;
        this.userId = userId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public Boolean getOnboardingRequired() {
        return onboardingRequired;
    }

    public Boolean getRequiresTotp() {
        return requiresTotp;
    }

    public String getTempToken() {
        return tempToken;
    }

    public Long getUserId() {
        return userId;
    }
}