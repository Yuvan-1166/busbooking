package com.yuvan.busbooking.auth.dto;

public record TotpLoginVerifyOtpRequest(
    String tempToken,
    String otp
) {}
