package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;


public record VerifyEmailResponse (
    @JsonProperty("accessToken")
    String accessToken,

    @JsonProperty("tokenType")
    String tokenType,

    @JsonProperty("expiresIn")
    Long expiresIn,

    @JsonProperty("email")
    String email,

    @JsonProperty("twitterEmailPending")
    Boolean twitterEmailPending

) {}
