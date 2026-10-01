package com.yuvan.busbooking.auth.otp.dto;

public record EmailLinkTokenResponse(
        String email,
        int expiresInMinutes
) {}
