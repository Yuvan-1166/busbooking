package com.yuvan.busbooking.payment.gateway.razorpay;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * A Razorpay payment entity, returned by {@code GET /v1/payments/{id}} and by
 * the {@code payment} entity inside webhook event payloads.
 */
public record RazorpayPaymentInfo(
        @JsonProperty("id") String id,
        @JsonProperty("entity") String entity,
        @JsonProperty("order_id") String orderId,
        @JsonProperty("status") String status,
        @JsonProperty("amount") long amount,
        @JsonProperty("currency") String currency,
        @JsonProperty("method") String method,
        @JsonProperty("captured") boolean captured,
        @JsonProperty("description") String description
) {}