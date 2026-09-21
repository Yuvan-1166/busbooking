package com.yuvan.busbooking.payment.dto;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import com.yuvan.busbooking.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Result of initiating a payment. For Razorpay, {@code gatewayOrderId} and
 * {@code gatewayKeyId} are the values needed to launch the client checkout.
 */
public record PaymentInitiateResponse(
        Long paymentId,
        Long bookingId,
        String transactionReference,
        PaymentMethod paymentMethod,
        PaymentStatus status,
        BigDecimal amount,
        String currency,
        String gatewayOrderId,
        String gatewayKeyId,
        LocalDateTime createdAt
) {}