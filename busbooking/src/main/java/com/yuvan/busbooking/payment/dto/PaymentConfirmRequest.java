package com.yuvan.busbooking.payment.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Confirms an initiated payment. For Razorpay, the three {@code gateway*}
 * fields are the values returned by the client checkout callback. The wallet
 * gateway needs only {@code paymentId}.
 */
public record PaymentConfirmRequest(

        @NotNull(message = "Payment ID is required")
        Long paymentId,

        String gatewayOrderId,
        String gatewayPaymentId,
        String gatewaySignature
) {}