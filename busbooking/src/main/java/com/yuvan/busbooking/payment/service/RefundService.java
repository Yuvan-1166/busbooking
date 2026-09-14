package com.yuvan.busbooking.payment.service;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.payment.entity.Payment;
import com.yuvan.busbooking.payment.entity.PaymentStatus;
import com.yuvan.busbooking.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefundService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentGateway paymentGateway;

    public RefundService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            PaymentGateway paymentGateway
    ) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.paymentGateway = paymentGateway;
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

        PaymentGatewayResult result =
                paymentGateway.refundPayment(
                        payment.getTransactionReference(),
                        payment.getAmount()
                );

        if (!result.successful()) {

            throw new IllegalArgumentException(
                    "Refund failed: " + result.message()
            );
        }

        payment.setStatus(PaymentStatus.REFUNDED);

        return paymentRepository.save(payment);
    }
}