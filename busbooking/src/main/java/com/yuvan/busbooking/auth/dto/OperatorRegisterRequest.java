package com.yuvan.busbooking.auth.dto;

import jakarta.validation.constraints.*;

public record OperatorRegisterRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 100)
        String password,

        @NotBlank
        @Size(max = 100)
        String firstName,

        @Size(max = 100)
        String lastName,

        @Size(max = 20)
        String phone,

        @NotBlank
        @Size(max = 150)
        String operatorName,

        @NotBlank
        @Size(max = 100)
        String registrationNumber,

        @NotBlank
        @Size(max = 20)
        String contactPhone
) {}