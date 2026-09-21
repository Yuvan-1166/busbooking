package com.yuvan.busbooking.payment.service;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.payment.entity.Payment;
import com.yuvan.busbooking.payment.entity.PaymentStatus;
import com.yuvan.busbooking.payment.gateway.PaymentGateway;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayFactory;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayRefundRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayResult;
import com.yuvan.busbooking.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Routes a refund back to the <em>original</em> payment method. The concrete
 * gateway is resolved from the payment's method via the factory — Razorpay
 * payments are refunded to the card/UPI account, wallet payments are credited
 * back to the wallet.
 */
@Service
public class RefundService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentGatewayFactory gatewayFactory;

    public RefundService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            PaymentGatewayFactory gatewayFactory
    ) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.gatewayFactory = gatewayFactory;
    }

    @Transactional
    public Payment refundBooking(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + bookingId
                        )
                );

        if (booking.getStatus() != BookingStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Only cancelled bookings can be refunded"
            );
        }

        Payment payment = paymentRepository
                .findByBookingId(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment not found for booking: " + bookingId
                        )
                );

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException(
                    "Payment has already been refunded"
            );
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new IllegalArgumentException(
                    "Only successful payments can be refunded"
            );
        }

        PaymentGateway gateway = gatewayFactory.getGateway(payment.getPaymentMethod());

        String gatewayTransactionId = payment.getGatewayPaymentId() != null
                ? payment.getGatewayPaymentId()
                : payment.getTransactionReference();

        PaymentGatewayResult result = gateway.refund(new PaymentGatewayRefundRequest(
                gatewayTransactionId,
                payment.getAmount(),
                payment.getBooking().getUser().getId()
        ));

        if (!result.successful()) {
            throw new IllegalArgumentException(
                    "Refund failed: " + result.message()
            );
        }

        payment.setStatus(PaymentStatus.REFUNDED);

        return paymentRepository.save(payment);
    }
}