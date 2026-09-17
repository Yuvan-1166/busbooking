package com.yuvan.busbooking.user.dto;

import com.yuvan.busbooking.user.entity.UserStatus;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Boolean totpEnabled,
        Boolean mobileVerified,
        LocalDateTime mobileVerifiedAt
) {
}