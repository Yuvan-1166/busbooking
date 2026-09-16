package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for Google OAuth callback.
 * Contains the ID token from the frontend (@react-oauth/google).
 * userType determines if user is created as PASSENGER or OPERATOR.
 */
public record GoogleOAuthRequest(
        @NotBlank(message = "Google ID token is required")
        String idToken,
        
        @NotBlank(message = "User type is required (PASSENGER or OPERATOR)")
        String userType
) {}
