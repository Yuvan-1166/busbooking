package com.yuvan.busbooking.auth.dto;

import tools.jackson.databind.annotation.JsonDeserialize;
import com.yuvan.busbooking.auth.registration.RegistrationType;
import com.yuvan.busbooking.common.util.Base64Deserializer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotNull
        RegistrationType userType,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @JsonDeserialize(using = Base64Deserializer.class)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,100}$", 
                message = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
        )
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