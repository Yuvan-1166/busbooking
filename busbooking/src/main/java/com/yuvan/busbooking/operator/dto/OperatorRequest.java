package com.yuvan.busbooking.operator.dto;

import com.yuvan.busbooking.operator.entity.OperatorStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OperatorRequest(

        Long userId,

        @NotBlank
        @Size(max = 150)
        String name,

        @NotBlank
        @Size(max = 100)
        String registrationNumber,

        @NotBlank
        @Email
        String contactEmail,

        @Size(max = 20)
        String contactPhone,

        OperatorStatus status
) {
}