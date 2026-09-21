package com.yuvan.busbooking.payment.gateway.razorpay;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import com.yuvan.busbooking.payment.gateway.PaymentGateway;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayInitiateRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayRefundRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayResult;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayVerifyRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * {@link PaymentGateway} backed by Razorpay.
 *
 * <p>Razorpay's standard checkout flow is used:
 * {@link #initiate} creates a server-side order; the client opens the Razorpay
 * checkout against that order; {@link #verify} validates the checkout signature
 * and confirms the payment was captured.</p>
 */
@Service
public class RazorpayPaymentGateway implements PaymentGateway {

    private final RazorpayClient razorpayClient;
    private final RazorpaySignatureVerifier signatureVerifier;
    private final RazorpayProperties properties;

    public RazorpayPaymentGateway(
            RazorpayClient razorpayClient,
            RazorpaySignatureVerifier signatureVerifier,
            RazorpayProperties properties
    ) {
        this.razorpayClient = razorpayClient;
        this.signatureVerifier = signatureVerifier;
        this.properties = properties;
    }

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.RAZORPAY;
    }

    @Override
    public PaymentGatewayResult initiate(PaymentGatewayInitiateRequest request) {
        ensureConfigured();

        RazorpayOrderResponse order = razorpayClient.createOrder(
                request.amount(),
                properties.currency(),
                request.transactionReference(),
                Map.of("purpose", "Bus booking")
        );

        return PaymentGatewayResult.success(
                "Razorpay order created",
                Map.of(
                        METADATA_ORDER_ID, order.id(),
                        METADATA_KEY_ID, properties.keyId()
                )
        );
    }

    @Override
    public PaymentGatewayResult verify(PaymentGatewayVerifyRequest request) {
        ensureConfigured();

        String orderId = request.attributes().get(ATTRIBUTE_ORDER_ID);
        String paymentId = request.attributes().get(ATTRIBUTE_PAYMENT_ID);
        String signature = request.attributes().get(ATTRIBUTE_SIGNATURE);

        if (orderId == null || paymentId == null || signature == null) {
            return PaymentGatewayResult.failure(
                    "Missing Razorpay verification details. Please retry payment."
            );
        }

        if (!signatureVerifier.isCheckoutSignatureValid(
                orderId, paymentId, signature, properties.keySecret())) {
            return PaymentGatewayResult.failure(
                    "Payment signature verification failed. Please retry payment."
            );
        }

        RazorpayPaymentInfo info = razorpayClient.fetchPayment(paymentId);
        if (info == null || !info.captured() || !"captured".equalsIgnoreCase(info.status())) {
            return PaymentGatewayResult.failure(
                    "Razorpay payment was not captured by the provider."
            );
        }

        return PaymentGatewayResult.success(
                "Razorpay payment verified",
                Map.of(METADATA_PAYMENT_ID, paymentId)
        );
    }

    @Override
    public PaymentGatewayResult refund(PaymentGatewayRefundRequest request) {
        ensureConfigured();

        if (!StringUtils.hasText(request.gatewayTransactionId())) {
            return PaymentGatewayResult.failure(
                    "Missing Razorpay payment reference for refund."
            );
        }

        razorpayClient.refund(request.gatewayTransactionId(), request.amount());
        return PaymentGatewayResult.success("Razorpay refund initiated");
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(properties.keyId())
                || !StringUtils.hasText(properties.keySecret())) {
            throw new IllegalStateException(
                    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            );
        }
    }
}