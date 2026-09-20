package com.yuvan.busbooking.auth.dto;

import com.yuvan.busbooking.auth.registration.RegistrationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotNull
        RegistrationType userType,

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

        @Size(max = 150)
        String operatorName,

        @Size(max = 100)
        String registrationNumber,

        @Size(max = 20)
        String contactPhone

) {}