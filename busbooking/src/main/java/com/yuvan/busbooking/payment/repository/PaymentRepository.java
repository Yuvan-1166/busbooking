package com.yuvan.busbooking.payment.repository;

import com.yuvan.busbooking.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    Optional<Payment> findByTransactionReference(
            String transactionReference
    );

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);

    boolean existsByBookingId(Long bookingId);
    
}