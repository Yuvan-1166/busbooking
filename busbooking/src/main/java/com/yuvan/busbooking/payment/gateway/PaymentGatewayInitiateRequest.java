package com.yuvan.busbooking.payment.gateway;

import java.math.BigDecimal;

/**
 * Context required by a {@link PaymentGateway} to prepare a payment.
 * Deliberately provider-agnostic so every gateway can be handled uniformly.
 *
 * @param transactionReference stable, unique local reference (used as receipt).
 * @param amount              amount in major units (e.g. rupees).
 */
public record PaymentGatewayInitiateRequest(
        String transactionReference,
        BigDecimal amount
) {}