package com.yuvan.busbooking.payment.gateway.razorpay;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Shape of a Razorpay webhook delivery. The {@code payload.payment.entity}
 * carries the {@link RazorpayPaymentInfo} describing the captured payment.
 *
 * <p>Only the fields needed to route and settle a payment are mapped.</p>
 */
public record RazorpayWebhookPayload(
        @JsonProperty("event") String event,
        @JsonProperty("payload") Payload payload
) {

    public record Payload(
            @JsonProperty("payment") PaymentEvent payment
    ) {}

    public record PaymentEvent(
            @JsonProperty("entity") RazorpayPaymentInfo entity
    ) {}
}