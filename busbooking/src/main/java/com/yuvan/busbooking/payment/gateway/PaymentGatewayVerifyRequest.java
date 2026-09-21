package com.yuvan.busbooking.payment.gateway;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Context required by a {@link PaymentGateway} to confirm and settle a payment.
 *
 * @param userId     id of the paying user (needed by the wallet gateway).
 * @param amount     amount in major units (e.g. rupees).
 * @param attributes provider-specific verification data. For Razorpay this
 *                   carries {@link PaymentGateway#ATTRIBUTE_ORDER_ID},
 *                   {@link PaymentGateway#ATTRIBUTE_PAYMENT_ID} and
 *                   {@link PaymentGateway#ATTRIBUTE_SIGNATURE}; wallet passes none.
 */
public record PaymentGatewayVerifyRequest(
        Long userId,
        BigDecimal amount,
        Map<String, String> attributes
) {
    public PaymentGatewayVerifyRequest(Long userId, BigDecimal amount) {
        this(userId, amount, Map.of());
    }
}