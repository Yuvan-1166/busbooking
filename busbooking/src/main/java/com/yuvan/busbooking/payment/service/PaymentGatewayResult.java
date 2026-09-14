package com.yuvan.busbooking.payment.service;

public record PaymentGatewayResult(
        boolean successful,
        String message
) {}