package com.yuvan.busbooking.payment.gateway.razorpay;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response of {@code POST /v1/orders} on the Razorpay API.
 * Only the fields used by the app are mapped.
 */
public record RazorpayOrderResponse(
        @JsonProperty("id") String id,
        @JsonProperty("entity") String entity,
        @JsonProperty("amount") long amount,
        @JsonProperty("amount_paid") long amountPaid,
        @JsonProperty("amount_due") long amountDue,
        @JsonProperty("currency") String currency,
        @JsonProperty("receipt") String receipt,
        @JsonProperty("status") String status,
        @JsonProperty("attempts") int attempts,
        @JsonProperty("created_at") long createdAt
) {}