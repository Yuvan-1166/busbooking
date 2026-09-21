package com.yuvan.busbooking.payment.gateway.razorpay;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response of {@code POST /v1/payments/{id}/refund} on the Razorpay API.
 */
public record RazorpayRefundResponse(
        @JsonProperty("id") String id,
        @JsonProperty("entity") String entity,
        @JsonProperty("payment_id") String paymentId,
        @JsonProperty("status") String status,
        @JsonProperty("amount") long amount,
        @JsonProperty("currency") String currency,
        @JsonProperty("created_at") long createdAt
) {}