package com.yuvan.busbooking.payment.dto;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import com.yuvan.busbooking.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long bookingId,
        String transactionReference,
        PaymentStatus status,
        PaymentMethod paymentMethod,
        BigDecimal amount,
        String currency,
        String gatewayOrderId,
        String gatewayPaymentId,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}