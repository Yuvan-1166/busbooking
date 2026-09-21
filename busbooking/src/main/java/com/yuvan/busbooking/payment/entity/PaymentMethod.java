package com.yuvan.busbooking.payment.entity;

/**
 * Identifies a supported payment method.
 *
 * <p>Adding a new method only requires a new enum constant plus a
 * {@link com.yuvan.busbooking.payment.gateway.PaymentGateway} bean that
 * implements the flow.</p>
 */
public enum PaymentMethod {
    /** All online payments (UPI, cards, net banking, wallets) via Razorpay. */
    RAZORPAY,
    /** Payments settled against the user's in-app wallet balance. */
    WALLET
}