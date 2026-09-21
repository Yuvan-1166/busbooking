package com.yuvan.busbooking.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingPassenger;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.entity.SeatHold;
import com.yuvan.busbooking.booking.entity.SeatHoldStatus;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.payment.dto.PaymentConfirmRequest;
import com.yuvan.busbooking.payment.dto.PaymentConfirmResponse;
import com.yuvan.busbooking.payment.dto.PaymentInitiateRequest;
import com.yuvan.busbooking.payment.dto.PaymentInitiateResponse;
import com.yuvan.busbooking.payment.entity.Payment;
import com.yuvan.busbooking.payment.entity.PaymentStatus;
import com.yuvan.busbooking.payment.gateway.PaymentGateway;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayFactory;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayInitiateRequest;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayResult;
import com.yuvan.busbooking.payment.gateway.PaymentGatewayVerifyRequest;
import com.yuvan.busbooking.payment.gateway.razorpay.RazorpayPaymentInfo;
import com.yuvan.busbooking.payment.gateway.razorpay.RazorpayProperties;
import com.yuvan.busbooking.payment.gateway.razorpay.RazorpaySignatureVerifier;
import com.yuvan.busbooking.payment.gateway.razorpay.RazorpayWebhookPayload;
import com.yuvan.busbooking.payment.repository.PaymentRepository;
import com.yuvan.busbooking.ticket.dto.TicketResponse;
import com.yuvan.busbooking.ticket.service.TicketService;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.yuvan.busbooking.payment.gateway.PaymentGateway.ATTRIBUTE_ORDER_ID;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.ATTRIBUTE_PAYMENT_ID;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.ATTRIBUTE_SIGNATURE;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.METADATA_KEY_ID;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.METADATA_ORDER_ID;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.METADATA_PAYMENT_ID;
import static com.yuvan.busbooking.payment.gateway.PaymentGateway.METADATA_WALLET_BALANCE;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    /** Razorpay webhook events that represent a successfully captured payment. */
    private static final Set<String> CAPTURE_EVENTS = Set.of(
            "payment.captured", "payment.authorized"
    );

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingPassengerRepository bookingPassengerRepository;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PaymentGatewayFactory gatewayFactory;
    private final RazorpaySignatureVerifier razorpaySignatureVerifier;
    private final RazorpayProperties razorpayProperties;
    private final ObjectMapper objectMapper;

    public PaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            BookingPassengerRepository bookingPassengerRepository,
            TicketService ticketService,
            UserRepository userRepository,
            EmailService emailService,
            PaymentGatewayFactory gatewayFactory,
            RazorpaySignatureVerifier razorpaySignatureVerifier,
            RazorpayProperties razorpayProperties,
            ObjectMapper objectMapper
    ) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.ticketService = ticketService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.gatewayFactory = gatewayFactory;
        this.razorpaySignatureVerifier = razorpaySignatureVerifier;
        this.razorpayProperties = razorpayProperties;
        this.objectMapper = objectMapper;
    }

    /**
     * Step 1 of the payment lifecycle. Creates (or reuses) an {@code INITIATED}
     * payment for the booking and asks the configured gateway to prepare it.
     *
     * @return checkout data — for Razorpay this includes the {@code order_id}
     *         and merchant {@code key_id} needed to launch the client checkout.
     */
    @Transactional
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) {

        Booking booking = bookingRepository
                .findById(request.bookingId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found with id: " + request.bookingId()
                        )
                );

        validateBooking(booking);
        verifyOwnership(booking);

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .filter(p -> p.getStatus() == PaymentStatus.INITIATED)
                .orElseGet(() -> {
                    Payment newPayment = new Payment();
                    newPayment.setBooking(booking);
                    newPayment.setTransactionReference(generateTransactionReference());
                    newPayment.setAmount(booking.getTotalAmount());
                    newPayment.setPaymentMethod(request.paymentMethod());
                    newPayment.setStatus(PaymentStatus.INITIATED);
                    return paymentRepository.save(newPayment);
                });

        if (payment.getTransactionReference() == null) {
            payment.setTransactionReference(generateTransactionReference());
        }
        if (payment.getPaymentMethod() != request.paymentMethod()) {
            payment.setPaymentMethod(request.paymentMethod());
        }

        PaymentGateway gateway = gatewayFactory.getGateway(request.paymentMethod());

        PaymentGatewayResult result = gateway.initiate(new PaymentGatewayInitiateRequest(
                payment.getTransactionReference(),
                payment.getAmount()
        ));

        if (!result.successful()) {
            throw new IllegalStateException(
                    "Payment initiation failed: " + result.message()
            );
        }

        String gatewayOrderId = result.metadata().get(METADATA_ORDER_ID);
        if (gatewayOrderId != null) {
            payment.setGatewayOrderId(gatewayOrderId);
        }

        payment = paymentRepository.save(payment);

        return toInitiateResponse(payment, result);
    }

    /**
     * Step 2 of the payment lifecycle. Confirms and settles an initiated
     * payment through the gateway resolved for the payment's method.
     */
    @Transactional
    public PaymentConfirmResponse confirmPayment(PaymentConfirmRequest request) {

        Payment payment = paymentRepository.findById(request.paymentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment not found with id: " + request.paymentId()
                        )
                );

        Booking booking = payment.getBooking();

        verifyOwnership(booking);

        if (payment.getStatus() != PaymentStatus.INITIATED) {
            throw new IllegalArgumentException(
                    "Payment is not awaiting confirmation"
            );
        }

        Map<String, String> attributes = new HashMap<>();
        if (request.gatewayOrderId() != null) {
            attributes.put(ATTRIBUTE_ORDER_ID, request.gatewayOrderId());
        }
        if (request.gatewayPaymentId() != null) {
            attributes.put(ATTRIBUTE_PAYMENT_ID, request.gatewayPaymentId());
        }
        if (request.gatewaySignature() != null) {
            attributes.put(ATTRIBUTE_SIGNATURE, request.gatewaySignature());
        }

        PaymentGateway gateway = gatewayFactory.getGateway(payment.getPaymentMethod());

        PaymentGatewayResult result = gateway.verify(new PaymentGatewayVerifyRequest(
                booking.getUser().getId(),
                payment.getAmount(),
                attributes
        ));

        BigDecimal walletBalanceAfter = null;

        if (result.successful()) {
            String gatewayPaymentId = result.metadata().get(METADATA_PAYMENT_ID);
            if (gatewayPaymentId != null) {
                payment.setGatewayPaymentId(gatewayPaymentId);
            }
            String walletBalance = result.metadata().get(METADATA_WALLET_BALANCE);
            if (walletBalance != null) {
                walletBalanceAfter = new BigDecimal(walletBalance);
            }
            completeSuccessfulPayment(payment, booking);
        } else {
            handleFailedPayment(payment, booking, result.message());
        }

        payment = paymentRepository.save(payment);

        return toConfirmResponse(payment, walletBalanceAfter);
    }

    /**
     * Server-side confirmation for Razorpay webhook deliveries. Confirms the
     * booking when the payment was captured, even if the client never returned
     * from the checkout.
     */
    @Transactional
    public void handleRazorpayWebhook(String signature, String rawPayload) {
        if (!razorpaySignatureVerifier.isWebhookSignatureValid(
                rawPayload, signature, razorpayProperties.webhookSecret())) {
            throw new IllegalArgumentException("Invalid Razorpay webhook signature");
        }

        RazorpayWebhookPayload webhook;
        try {
            webhook = objectMapper.readValue(rawPayload, RazorpayWebhookPayload.class);
        } catch (Exception e) {
            log.warn("Malformed Razorpay webhook payload: {}", e.getMessage());
            return;
        }

        if (webhook == null
                || webhook.payload() == null
                || webhook.payload().payment() == null
                || webhook.payload().payment().entity() == null) {
            return;
        }

        RazorpayPaymentInfo paymentInfo = webhook.payload().payment().entity();

        if (!CAPTURE_EVENTS.contains(webhook.event())) {
            return;
        }

        Payment payment = paymentRepository
                .findByGatewayOrderId(paymentInfo.orderId())
                .orElse(null);

        if (payment == null) {
            log.warn("Razorpay webhook for unknown order {} ignored",
                    paymentInfo.orderId());
            return;
        }

        if (payment.getStatus() != PaymentStatus.INITIATED) {
            return;
        }

        if (!paymentInfo.captured() || !"captured".equalsIgnoreCase(paymentInfo.status())) {
            log.warn("Razorpay webhook reports non-captured payment {} for order {}",
                    paymentInfo.id(), paymentInfo.orderId());
            return;
        }

        payment.setGatewayPaymentId(paymentInfo.id());
        completeSuccessfulPayment(payment, payment.getBooking());
        paymentRepository.save(payment);
    }

    private void validateBooking(Booking booking) {
        if (booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
            throw new IllegalArgumentException("Booking is not awaiting payment");
        }
    }

    private void verifyOwnership(Booking booking) {
        User caller = userRepository.findByEmail(SecurityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!booking.getUser().getId().equals(caller.getId())) {
            throw new IllegalArgumentException("This booking does not belong to you");
        }
    }

    private void completeSuccessfulPayment(Payment payment, Booking booking) {
        payment.setStatus(PaymentStatus.SUCCESS);
        booking.setStatus(BookingStatus.CONFIRMED);

        List<BookingPassenger> passengers =
                bookingPassengerRepository.findByBookingId(booking.getId());

        for (BookingPassenger passenger : passengers) {
            SeatHold hold = passenger.getSeatHold();
            TripSeat tripSeat = passenger.getTripSeat();
            hold.setStatus(SeatHoldStatus.CONVERTED);
            tripSeat.setStatus(TripSeatStatus.BOOKED);
            tripSeat.setHeldUntil(null);
        }

        TicketResponse ticket = ticketService.generateTicket(booking.getId());

        // Send booking confirmation email — wrapped so an SMTP failure never
        // rolls back the payment transaction.
        try {
            User user = booking.getUser();

            List<BookingPassengerResponse> passengerResponses = passengers.stream()
                    .map(p -> new BookingPassengerResponse(
                            p.getId(),
                            p.getTripSeat().getId(),
                            p.getTripSeat().getSeat().getSeatNumber(),
                            p.getFirstName(),
                            p.getLastName(),
                            p.getAge(),
                            p.getGender()
                    ))
                    .toList();

            emailService.sendBookingConfirmation(
                    user.getEmail(),
                    user.getFirstName(),
                    booking.getBookingReference(),
                    ticket.ticketNumber(),
                    booking.getTrip().getTripDate(),
                    booking.getTrip().getDepartureTime(),
                    booking.getPickupLocation().getCity(),
                    booking.getDropLocation().getCity(),
                    passengerResponses,
                    booking.getTotalAmount()
            );
        } catch (Exception e) {
            log.warn("Booking confirmation email failed for booking {}: {}",
                    booking.getBookingReference(), e.getMessage());
        }
    }

    private void handleFailedPayment(Payment payment, Booking booking, String reason) {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        booking.setStatus(BookingStatus.FAILED);

        List<BookingPassenger> passengers =
                bookingPassengerRepository.findByBookingId(booking.getId());

        for (BookingPassenger passenger : passengers) {
            SeatHold hold = passenger.getSeatHold();
            TripSeat tripSeat = passenger.getTripSeat();
            hold.setStatus(SeatHoldStatus.RELEASED);
            tripSeat.setStatus(TripSeatStatus.AVAILABLE);
            tripSeat.setHeldUntil(null);
        }
    }

    private String generateTransactionReference() {
        return "TXN-" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase();
    }

    private PaymentInitiateResponse toInitiateResponse(
            Payment payment,
            PaymentGatewayResult result
    ) {
        return new PaymentInitiateResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getTransactionReference(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getGatewayOrderId(),
                result.metadata().get(METADATA_KEY_ID),
                payment.getCreatedAt()
        );
    }

    private PaymentConfirmResponse toConfirmResponse(
            Payment payment,
            BigDecimal walletBalanceAfter
    ) {
        return new PaymentConfirmResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getTransactionReference(),
                payment.getStatus(),
                payment.getPaymentMethod(),
                payment.getAmount(),
                payment.getFailureReason(),
                walletBalanceAfter,
                payment.getUpdatedAt()
        );
    }
}