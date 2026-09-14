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
        String failureReason,
        /** Non-null only when paymentMethod is WALLET. Shows balance remaining after payment. */
        BigDecimal walletBalanceAfter,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
