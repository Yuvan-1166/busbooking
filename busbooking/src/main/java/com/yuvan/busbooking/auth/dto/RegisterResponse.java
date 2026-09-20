package com.yuvan.busbooking.auth.dto;

public record RegisterResponse(
        Long userId,
        Long operatorId,
        String email,
        String firstName,
        String operatorName,
        String message
) {}