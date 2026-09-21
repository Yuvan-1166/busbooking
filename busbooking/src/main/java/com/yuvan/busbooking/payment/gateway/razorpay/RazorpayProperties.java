package com.yuvan.busbooking.payment.gateway.razorpay;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Razorpay integration settings bound from {@code app.razorpay.*}.
 *
 * @param keyId          Razorpay API key id (public).
 * @param keySecret      Razorpay API key secret (used for Basic auth + checkout signature).
 * @param webhookSecret  secret used to verify Razorpay webhook signatures.
 * @param currency       ISO currency for created orders (defaults to INR).
 */
@ConfigurationProperties(prefix = "app.razorpay")
public record RazorpayProperties(
        String keyId,
        String keySecret,
        String webhookSecret,
        String currency
) {

    public RazorpayProperties {
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }
    }
}