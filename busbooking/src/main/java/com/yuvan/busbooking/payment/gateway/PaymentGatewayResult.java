package com.yuvan.busbooking.payment.gateway;

import java.util.Map;

/**
 * Result of a {@link PaymentGateway} operation.
 *
 * @param successful whether the gateway operation succeeded.
 * @param message    human-readable outcome (e.g. failure reason).
 * @param metadata   provider-specific extra data produced by the operation
 *                   (e.g. order id, public key, wallet balance).
 */
public record PaymentGatewayResult(
        boolean successful,
        String message,
        Map<String, String> metadata
) {

    public PaymentGatewayResult(boolean successful, String message) {
        this(successful, message, Map.of());
    }

    public static PaymentGatewayResult success(String message) {
        return new PaymentGatewayResult(true, message, Map.of());
    }

    public static PaymentGatewayResult success(String message, Map<String, String> metadata) {
        return new PaymentGatewayResult(true, message, metadata);
    }

    public static PaymentGatewayResult failure(String message) {
        return new PaymentGatewayResult(false, message, Map.of());
    }
}