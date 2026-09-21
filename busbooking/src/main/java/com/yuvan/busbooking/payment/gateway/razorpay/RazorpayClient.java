package com.yuvan.busbooking.payment.gateway.razorpay;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Thin HTTP client over the Razorpay REST API ({@code https://api.razorpay.com}).
 *
 * <p>Every request is authenticated with HTTP Basic auth using the merchant's
 * key id and key secret. Amounts are converted from rupees to paise (Razorpay
 * only accepts integer amounts in the smallest currency unit).</p>
 */
@Component
public class RazorpayClient {

    public static final String BASE_URL = "https://api.razorpay.com/v1";

    private final RestClient restClient;

    public RazorpayClient(RazorpayProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeaders(headers -> headers.add(
                        HttpHeaders.AUTHORIZATION,
                        buildBasicAuth(properties.keyId(), properties.keySecret())
                ))
                .build();
    }

    /**
     * Creates a Razorpay order against which the checkout is later opened.
     *
     * @param amount   order amount in rupees.
     * @param currency ISO currency code.
     * @param receipt  merchant receipt (local transaction reference).
     * @param notes    free-form notes attached to the order.
     * @return the created order.
     */
    public RazorpayOrderResponse createOrder(
            BigDecimal amount,
            String currency,
            String receipt,
            Map<String, String> notes
    ) {
        try {
            return restClient.post()
                    .uri("/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "amount", rupeesToPaise(amount),
                            "currency", currency,
                            "receipt", receipt,
                            "notes", notes == null ? Map.of() : notes
                    ))
                    .retrieve()
                    .body(RazorpayOrderResponse.class);
        } catch (RestClientException e) {
            throw new RazorpayApiException("Failed to create Razorpay order: " + describe(e), e);
        }
    }

    /**
     * Fetches the current state of a captured/attempted payment.
     */
    public RazorpayPaymentInfo fetchPayment(String paymentId) {
        try {
            return restClient.get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .body(RazorpayPaymentInfo.class);
        } catch (RestClientException e) {
            throw new RazorpayApiException(
                    "Failed to fetch Razorpay payment " + paymentId + ": " + describe(e), e);
        }
    }

    /**
     * Initiates a refund for a captured payment.
     */
    public RazorpayRefundResponse refund(String paymentId, BigDecimal amount) {
        try {
            return restClient.post()
                    .uri("/payments/{paymentId}/refund", paymentId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", rupeesToPaise(amount)))
                    .retrieve()
                    .body(RazorpayRefundResponse.class);
        } catch (RestClientException e) {
            throw new RazorpayApiException(
                    "Failed to refund Razorpay payment " + paymentId + ": " + describe(e), e);
        }
    }

    private static String buildBasicAuth(String keyId, String keySecret) {
        String credentials = (keyId == null ? "" : keyId)
                + ":" + (keySecret == null ? "" : keySecret);
        return "Basic " + Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private static long rupeesToPaise(BigDecimal rupees) {
        return rupees.multiply(BigDecimal.valueOf(100)).longValueExact();
    }

    private static String describe(RestClientException e) {
        if (e instanceof RestClientResponseException responseException) {
            return responseException.getStatusCode() + " " + responseException.getResponseBodyAsString();
        }
        return e.getMessage();
    }
}