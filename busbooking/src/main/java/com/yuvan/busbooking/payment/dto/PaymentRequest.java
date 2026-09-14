package com.yuvan.busbooking.payment.dto;

import com.yuvan.busbooking.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(

        @NotNull(message = "Booking ID is required")
        Long bookingId,

        @NotNull(message = "Payment method is required")
        PaymentMethod paymentMethod
) {}