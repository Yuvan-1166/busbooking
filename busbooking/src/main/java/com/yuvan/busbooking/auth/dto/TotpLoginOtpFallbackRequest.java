package com.yuvan.busbooking.auth.dto;

public record TotpLoginOtpFallbackRequest(
    String tempToken,
    String email
) {}
