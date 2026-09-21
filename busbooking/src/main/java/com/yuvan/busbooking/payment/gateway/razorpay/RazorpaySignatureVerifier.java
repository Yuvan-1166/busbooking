package com.yuvan.busbooking.payment.gateway.razorpay;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Verifies the HMAC-SHA256 signatures Razorpay produces for both the checkout
 * callback and webhook deliveries.
 *
 * <ul>
 *   <li>Checkout: the digest of {@code order_id + "|" + payment_id} signed
 *       with the API {@code key_secret}.</li>
 *   <li>Webhook: the digest of the raw request body signed with the configured
 *       webhook secret.</li>
 * </ul>
 */
@Component
public class RazorpaySignatureVerifier {

    /** Signature sent back by the Razorpay Checkout response. */
    public boolean isCheckoutSignatureValid(
            String orderId,
            String paymentId,
            String signature,
            String secret
    ) {
        String message = orderId + "|" + paymentId;
        return isSignatureValid(message, secret, signature);
    }

    /** Signature carried in the {@code x-razorpay-signature} webhook header. */
    public boolean isWebhookSignatureValid(
            String rawPayload,
            String signature,
            String secret
    ) {
        return isSignatureValid(rawPayload, secret, signature);
    }

    private boolean isSignatureValid(String message, String secret, String signature) {
        if (message == null || secret == null || signature == null || signature.isBlank()) {
            return false;
        }
        try {
            String expected = hmacSha256(message, secret);
            return constantTimeEquals(expected, signature);
        } catch (GeneralSecurityException e) {
            return false;
        }
    }

    private static String hmacSha256(String data, String secret)
            throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        ));
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(raw);
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }
}