package com.yuvan.busbooking.payment.controller;

import com.yuvan.busbooking.payment.dto.PaymentRequest;
import com.yuvan.busbooking.payment.dto.PaymentResponse;
import com.yuvan.busbooking.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<PaymentResponse> processPayment(
            @Valid @RequestBody PaymentRequest request
    ) {

        return ResponseEntity.ok(
                paymentService.processPayment(request)
        );
    }
    
}