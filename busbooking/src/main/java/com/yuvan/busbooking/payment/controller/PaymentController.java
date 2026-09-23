package com.yuvan.busbooking.payment.controller;

import com.yuvan.busbooking.payment.dto.PaymentConfirmRequest;
import com.yuvan.busbooking.payment.dto.PaymentConfirmResponse;
import com.yuvan.busbooking.payment.dto.PaymentInitiateRequest;
import com.yuvan.busbooking.payment.dto.PaymentInitiateResponse;
import com.yuvan.busbooking.payment.dto.PaymentResponse;
import com.yuvan.busbooking.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Step 1 — prepares a payment for the booking. For Razorpay this returns
     * the order id and merchant key needed to launch the client checkout.
     */
    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<PaymentInitiateResponse> initiatePayment(
            @Valid @RequestBody PaymentInitiateRequest request
    ) {
        return ResponseEntity.ok(paymentService.initiatePayment(request));
    }

    /**
     * Step 2 — confirms and settles an initiated payment after the client
     * completes the payment (Razorpay checkout callback / wallet).
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<PaymentConfirmResponse> confirmPayment(
            @Valid @RequestBody PaymentConfirmRequest request
    ) {
        return ResponseEntity.ok(paymentService.confirmPayment(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentResponse>> findAll() {
        return ResponseEntity.ok(
                paymentService.findAll()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                paymentService.findById(id)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        paymentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Razorpay webhook receiver — used to settle payments server-side when the
     * client never returns from the checkout. Requires no user auth; the
     * provider signature is validated inside the service.
     */
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<Void> razorpayWebhook(
            @RequestHeader(value = "x-razorpay-signature", required = false) String signature,
            @RequestBody String rawPayload
    ) {
        paymentService.handleRazorpayWebhook(signature, rawPayload);
        return ResponseEntity.ok().build();
    }

}