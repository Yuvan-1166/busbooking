package com.yuvan.busbooking.payment.gateway.razorpay;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RazorpaySignatureVerifierTest {

    private static final String SECRET = "secret";
    private static final String ORDER_ID = "order_123";
    private static final String PAYMENT_ID = "pay_456";

    // Precomputed HMAC-SHA256("order_123|pay_456", "secret")
    private static final String EXPECTED_SIGNATURE =
            "18bfc0baafae8f6367711ee362f2201aaa3654274683100e5367bb9a2bd29cbe";

    private final RazorpaySignatureVerifier verifier = new RazorpaySignatureVerifier();

    @Test
    void acceptsValidCheckoutSignature() {
        assertThat(verifier.isCheckoutSignatureValid(
                ORDER_ID, PAYMENT_ID, EXPECTED_SIGNATURE, SECRET)).isTrue();
    }

    @Test
    void rejectsTamperedPayload() {
        assertThat(verifier.isCheckoutSignatureValid(
                ORDER_ID, "pay_999", EXPECTED_SIGNATURE, SECRET)).isFalse();
    }

    @Test
    void rejectsWrongSecret() {
        assertThat(verifier.isCheckoutSignatureValid(
                ORDER_ID, PAYMENT_ID, EXPECTED_SIGNATURE, "wrong-secret")).isFalse();
    }

    @Test
    void rejectsNullOrMissingSignatureData() {
        assertThat(verifier.isCheckoutSignatureValid(ORDER_ID, PAYMENT_ID, null, SECRET)).isFalse();
        assertThat(verifier.isCheckoutSignatureValid(ORDER_ID, PAYMENT_ID, "", SECRET)).isFalse();
        assertThat(verifier.isCheckoutSignatureValid(ORDER_ID, PAYMENT_ID, EXPECTED_SIGNATURE, null)).isFalse();
    }

    @Test
    void acceptsValidWebhookSignature() {
        String payload = "{\"event\":\"payment.captured\"}";
        String payloadSignature = hmacSha256(payload, SECRET);

        assertThat(verifier.isWebhookSignatureValid(payload, payloadSignature, SECRET)).isTrue();
        assertThat(verifier.isWebhookSignatureValid(payload, "deadbeef", SECRET)).isFalse();
        assertThat(verifier.isWebhookSignatureValid(payload, payloadSignature, "other-secret")).isFalse();
    }

    private static String hmacSha256(String data, String secret) {
        try {
            var mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                    secret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(
                    mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}