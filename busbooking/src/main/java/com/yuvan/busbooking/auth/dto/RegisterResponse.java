package com.yuvan.busbooking.auth.dto;

public record RegisterResponse(
        Long userId,
        String email,
        String firstName,
        String message
) {}