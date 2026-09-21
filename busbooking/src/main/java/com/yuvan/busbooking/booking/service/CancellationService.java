package com.yuvan.busbooking.booking.service;

import com.yuvan.busbooking.booking.dto.BookingCancellationRequest;
import com.yuvan.busbooking.booking.dto.CancellationResponse;
import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingPassenger;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.entity.Cancellation;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.booking.repository.CancellationRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.payment.service.RefundService;
import com.yuvan.busbooking.ticket.entity.Ticket;
import com.yuvan.busbooking.ticket.entity.TicketStatus;
import com.yuvan.busbooking.ticket.repository.TicketRepository;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class CancellationService {

    private final BookingRepository bookingRepository;
    private final BookingPassengerRepository bookingPassengerRepository;
    private final CancellationRepository cancellationRepository;
    private final RefundService refundService;
    private final TicketRepository ticketRepository;

    public CancellationService(
            BookingRepository bookingRepository,
            BookingPassengerRepository bookingPassengerRepository,
            CancellationRepository cancellationRepository,
            RefundService refundService,
            TicketRepository ticketRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.cancellationRepository = cancellationRepository;
        this.refundService = refundService;
        this.ticketRepository = ticketRepository;
    }

    @Transactional
    public CancellationResponse cancelBooking(
            Long bookingId,
            Long userId,
            BookingCancellationRequest request
    ) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + bookingId
                        )
                );

        // 1. Verify ownership
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You are not allowed to cancel this booking"
            );
        }

        // 2. Verify booking state
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Only confirmed bookings can be cancelled"
            );
        }

        // 3. Verify trip can still be cancelled
        Trip trip = booking.getTrip();

        validateTripCanBeCancelled(trip);

        // 4. Prevent duplicate cancellation
        if (cancellationRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException(
                    "Booking has already been cancelled"
            );
        }

        // 5. Calculate refund
        BigDecimal refundAmount = booking.getTotalAmount();

        // 6. Release seats
        for (BookingPassenger passenger :
                bookingPassengerRepository.findByBookingId(bookingId)) {

            TripSeat tripSeat = passenger.getTripSeat();

            if (tripSeat.getStatus() == TripSeatStatus.BOOKED) {
                tripSeat.setStatus(TripSeatStatus.AVAILABLE);
                tripSeat.setHeldUntil(null);
            }
        }

        // 7. Cancel booking
        booking.setStatus(BookingStatus.CANCELLED);

        Ticket ticket = ticketRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Ticket not found for booking: " + bookingId));
        ticket.setStatus(TicketStatus.CANCELLED);
        ticketRepository.save(ticket);

        bookingRepository.save(booking);

        // 8. Create cancellation record
        Cancellation cancellation = new Cancellation();

        cancellation.setBooking(booking);
        cancellation.setReason(request.reason());
        cancellation.setRefundAmount(refundAmount);

        cancellation = cancellationRepository.save(cancellation);

        refundService.refundBooking(bookingId);

        return toResponse(cancellation);
    }

    private void validateTripCanBeCancelled(Trip trip) {

        LocalDateTime now = LocalDateTime.now();

        if (trip.getTripDate().isBefore(now.toLocalDate())) {
            throw new IllegalArgumentException(
                    "Cannot cancel a booking for a past trip"
            );
        }

        if (trip.getTripDate().isEqual(now.toLocalDate())) {

            LocalTime departureTime = trip.getDepartureTime();

            if (!departureTime.isAfter(now.toLocalTime())) {
                throw new IllegalArgumentException(
                        "Cannot cancel a booking after trip departure"
                );
            }
        }
    }

    private CancellationResponse toResponse(
            Cancellation cancellation
    ) {

        Booking booking = cancellation.getBooking();

        return new CancellationResponse(
                cancellation.getId(),
                booking.getId(),
                booking.getBookingReference(),
                cancellation.getReason(),
                cancellation.getRefundAmount(),
                cancellation.getCancelledAt()
        );
    }
}