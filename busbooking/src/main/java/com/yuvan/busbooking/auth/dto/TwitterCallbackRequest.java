package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/v1/auth/twitter/callback}.
 *
 * <p>After Twitter redirects back to the frontend with {@code ?code=...&state=...},
 * the frontend forwards those values here along with the {@code userType} the user
 * selected before initiating sign-in.</p>
 *
 * @param code       Authorization code received from Twitter's redirect.
 * @param state      Opaque state token returned by the authorize step — used to prevent CSRF.
 * @param userType   "PASSENGER" or "OPERATOR".
 */
public record TwitterCallbackRequest(
        @NotBlank(message = "Authorization code is required")
        String code,

        @NotBlank(message = "State token is required")
        String state,

        @NotBlank(message = "User type is required")
        String userType
) {}
