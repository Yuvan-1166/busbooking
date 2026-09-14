package com.yuvan.busbooking.auth.dto;

public record OperatorRegisterResponse(
        Long userId,
        Long operatorId,
        String email,
        String operatorName,
        String message
) {}