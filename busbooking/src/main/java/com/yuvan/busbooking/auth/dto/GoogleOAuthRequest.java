package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for Google OAuth callback.
 * Contains the ID token from the frontend (@react-oauth/google).
 */
public record GoogleOAuthRequest(
        @NotBlank(message = "Google ID token is required")
        String idToken
) {}
