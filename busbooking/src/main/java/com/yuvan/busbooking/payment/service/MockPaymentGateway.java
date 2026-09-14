package com.yuvan.busbooking.payment.service;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class MockPaymentGateway
        implements PaymentGateway {

    @Override
    public PaymentGatewayResult processPayment(
            String transactionReference,
            BigDecimal amount,
            PaymentMethod paymentMethod
    ) {

        // Simulate successful payment.
        return new PaymentGatewayResult(
                true,
                "Payment processed successfully"
        );
    }

    @Override
        public PaymentGatewayResult refundPayment(
                String transactionReference,
                BigDecimal amount
        ) {
                return new PaymentGatewayResult(
                        true,
                        "Refund Processed Successfully"
                );
        }
}