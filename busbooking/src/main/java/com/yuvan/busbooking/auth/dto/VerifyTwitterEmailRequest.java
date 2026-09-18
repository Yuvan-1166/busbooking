package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request to verify and save email for Twitter OAuth users.
 * 
 * Twitter's free tier API doesn't expose email, so users provide it during onboarding.
 * We verify the email hasn't been taken and update the user record.
 *
 * @param email New email address for the user
 * @param otp   6-digit OTP sent to that email for verification
 */
public record VerifyTwitterEmailRequest(
        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "OTP is required")
        String otp
) {}
