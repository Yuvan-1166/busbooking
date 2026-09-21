package com.yuvan.busbooking.payment.gateway;

import java.math.BigDecimal;

/**
 * Context required by a {@link PaymentGateway} to refund a settled payment.
 *
 * @param gatewayTransactionId provider-side reference for the payment.
 *                             For Razorpay this is the captured payment id;
 *                             for the wallet it is unused and may be null.
 * @param amount               amount to refund in major units (e.g. rupees).
 * @param userId               id of the user being refunded (wallet gateway).
 */
public record PaymentGatewayRefundRequest(
        String gatewayTransactionId,
        BigDecimal amount,
        Long userId
) {}