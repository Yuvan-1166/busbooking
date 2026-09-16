package com.yuvan.busbooking.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OtpVerifyResponse(
        String message,
        String tempToken
) {
    // Constructor for simple message response (no tempToken)
    public OtpVerifyResponse(String message) {
        this(message, null);
    }
}
