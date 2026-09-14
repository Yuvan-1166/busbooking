package com.yuvan.busbooking.payment.service;

import com.yuvan.busbooking.payment.entity.PaymentMethod;

import java.math.BigDecimal;

public interface PaymentGateway {

    PaymentGatewayResult processPayment(
            String transactionReference,
            BigDecimal amount,
            PaymentMethod paymentMethod
    );

    PaymentGatewayResult refundPayment(
            String transactionReference,
            BigDecimal amount
    );
}