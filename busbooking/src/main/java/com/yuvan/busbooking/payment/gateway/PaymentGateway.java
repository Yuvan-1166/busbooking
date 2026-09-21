package com.yuvan.busbooking.payment.gateway;

import com.yuvan.busbooking.payment.entity.PaymentMethod;

/**
 * Strategy that encapsulates the entire lifetime of a payment for one concrete
 * payment method (e.g. Razorpay, wallet).
 *
 * <p>Implementations are Spring beans discovered automatically by
 * {@link PaymentGatewayFactory} and indexed by {@link #getMethod()}. Adding a
 * new payment method is a single new bean — no changes to the controller,
 * {@code PaymentService} or the factory.</p>
 *
 * <p>The lifecycle is <em>initiate</em> → (client performs the actual payment)
 * → <em>verify</em>, followed by <em>refund</em> for cancellations.</p>
 */
public interface PaymentGateway {

    /** Metadata key: provider order id (e.g. Razorpay {@code order_id}). */
    String METADATA_ORDER_ID = "orderId";

    /** Metadata key: provider public key needed to launch the checkout. */
    String METADATA_KEY_ID = "keyId";

    /** Metadata key: provider payment id (e.g. Razorpay {@code payment_id}). */
    String METADATA_PAYMENT_ID = "paymentId";

    /** Metadata key: wallet balance remaining after a wallet verification. */
    String METADATA_WALLET_BALANCE = "walletBalance";

    /** Verification attribute key: provider order id. */
    String ATTRIBUTE_ORDER_ID = "orderId";

    /** Verification attribute key: provider payment id. */
    String ATTRIBUTE_PAYMENT_ID = "paymentId";

    /** Verification attribute key: provider signature returned by the checkout. */
    String ATTRIBUTE_SIGNATURE = "signature";

    /**
     * @return the payment method this gateway implements.
     */
    PaymentMethod getMethod();

    /**
     * Prepares a payment for the given booking — e.g. creates a provider order
     * (Razorpay) or verifies readiness (wallet). No money moves yet.
     *
     * @param request booking-agnostic initiation context.
     * @return a result whose {@code metadata} may carry provider checkout data
     *         such as the order id and public key.
     */
    PaymentGatewayResult initiate(PaymentGatewayInitiateRequest request);

    /**
     * Confirms and settles a previously initiated payment. For Razorpay this
     * verifies the checkout signature; for the wallet it deducts the balance.
     *
     * @param request amount, user and provider-specific verification attributes.
     * @return a result whose {@code metadata} may carry the settled gateway
     *         payment id or the updated wallet balance.
     */
    PaymentGatewayResult verify(PaymentGatewayVerifyRequest request);

    /**
     * Returns money for a settled payment back to its original source.
     *
     * @param request payment reference, amount and owning user.
     * @return the refund result.
     */
    PaymentGatewayResult refund(PaymentGatewayRefundRequest request);
}