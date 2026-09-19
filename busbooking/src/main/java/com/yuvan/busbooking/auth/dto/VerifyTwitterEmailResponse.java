package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response object for Twitter email verification endpoint.
 * 
 * Contains both the updated user data and a new JWT with the verified email
 * encoded in the subject claim. The frontend should replace its session
 * with the new accessToken immediately.
 */
public class VerifyTwitterEmailResponse {
    @JsonProperty("accessToken")
    private final String accessToken;

    @JsonProperty("tokenType")
    private final String tokenType;

    @JsonProperty("expiresIn")
    private final Long expiresIn;

    @JsonProperty("email")
    private final String email;

    @JsonProperty("twitterEmailPending")
    private final Boolean twitterEmailPending;

    public VerifyTwitterEmailResponse(
            String accessToken,
            String tokenType,
            Long expiresIn,
            String email,
            Boolean twitterEmailPending
    ) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.email = email;
        this.twitterEmailPending = twitterEmailPending;
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

    public String getEmail() {
        return email;
    }

    public Boolean getTwitterEmailPending() {
        return twitterEmailPending;
    }
}
