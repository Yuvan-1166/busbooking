package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to complete user onboarding.
 * Includes role selection and additional profile details.
 */
public record OnboardingCompleteRequest(
        @NotBlank(message = "Role is required (PASSENGER or OPERATOR)")
        String role,
        
        String firstName,
        String lastName,
        String phone,
        
        // Operator-specific fields
        String operatorName,
        String registrationNumber,
        String contactPhone
) {}
