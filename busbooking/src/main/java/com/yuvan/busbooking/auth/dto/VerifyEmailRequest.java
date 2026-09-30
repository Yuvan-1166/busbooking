package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


public record VerifyEmailRequest(
        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "OTP is required")
        @JsonDeserialize (using = Base64Deserializer.class)
        String otp
) {}
