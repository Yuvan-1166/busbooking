package com.yuvan.busbooking.payment.service;

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
import com.yuvan.busbooking.payment.dto.PaymentRequest;
import com.yuvan.busbooking.payment.dto.PaymentResponse;
import com.yuvan.busbooking.payment.entity.Payment;
import com.yuvan.busbooking.payment.entity.PaymentMethod;
import com.yuvan.busbooking.payment.entity.PaymentStatus;
import com.yuvan.busbooking.payment.repository.PaymentRepository;
import com.yuvan.busbooking.ticket.dto.TicketResponse;
import com.yuvan.busbooking.ticket.service.TicketService;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentGateway paymentGateway;
    private final BookingPassengerRepository bookingPassengerRepository;
    private final TicketService ticketService;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public PaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            PaymentGateway paymentGateway,
            BookingPassengerRepository bookingPassengerRepository,
            TicketService ticketService,
            WalletService walletService,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.paymentGateway = paymentGateway;
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.ticketService = ticketService;
        this.walletService = walletService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {

        Booking booking = bookingRepository
                .findById(request.bookingId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found with id: " + request.bookingId()
                        )
                );

        validateBooking(booking);

        // Ownership check — the caller must own this booking
        String email = SecurityUtils.getCurrentUserEmail();
        User caller = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!booking.getUser().getId().equals(caller.getId())) {
            throw new IllegalArgumentException("This booking does not belong to you");
        }

        if (paymentRepository.existsByBookingId(booking.getId())) {
            throw new IllegalArgumentException(
                    "Payment already exists for this booking"
            );
        }

        String transactionReference = generateTransactionReference();

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setTransactionReference(transactionReference);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setAmount(booking.getTotalAmount());
        payment.setStatus(PaymentStatus.PROCESSING);
        payment = paymentRepository.save(payment);

        BigDecimal walletBalanceAfter = null;

        if (request.paymentMethod() == PaymentMethod.WALLET) {
            // Real wallet deduction — no mock gateway needed
            try {
                walletBalanceAfter = walletService.deduct(
                        booking.getUser().getId(),
                        booking.getTotalAmount()
                );
                completeSuccessfulPayment(payment, booking);
            } catch (IllegalArgumentException e) {
                handleFailedPayment(payment, booking, e.getMessage());
            }
        } else {
            // All other methods go through the mock gateway
            PaymentGatewayResult result = paymentGateway.processPayment(
                    transactionReference,
                    payment.getAmount(),
                    payment.getPaymentMethod()
            );
            if (result.successful()) {
                completeSuccessfulPayment(payment, booking);
            } else {
                handleFailedPayment(payment, booking, result.message());
            }
        }

        return toResponse(payment, walletBalanceAfter);
    }

    private void validateBooking(Booking booking) {
        if (booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
            throw new IllegalArgumentException("Booking is not awaiting payment");
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

    private PaymentResponse toResponse(Payment payment, BigDecimal walletBalanceAfter) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getTransactionReference(),
                payment.getStatus(),
                payment.getPaymentMethod(),
                payment.getAmount(),
                payment.getFailureReason(),
                walletBalanceAfter,
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}
