package com.yuvan.busbooking.trip.service;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.payment.service.RefundService;
import com.yuvan.busbooking.ticket.entity.TicketStatus;
import com.yuvan.busbooking.ticket.repository.TicketRepository;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.entity.TripStatus;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Handles operator-initiated trip cancellations with automatic refunds.
 * When a trip is cancelled by an operator, all confirmed bookings are:
 * 1. Marked as CANCELLED with the operator's reason
 * 2. Passengers are refunded the full booking amount via their original
 *    payment method (Razorpay refund or wallet credit)
 * 3. Tickets are moved to past bookings with cancellation reason
 */
@Service
public class TripCancellationService {

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final TripSeatRepository tripSeatRepository;
    private final RefundService refundService;

    public TripCancellationService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            TripSeatRepository tripSeatRepository,
            RefundService refundService
    ) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.tripSeatRepository = tripSeatRepository;
        this.refundService = refundService;
    }

    @Transactional
    public void cancelTripAndRefundAllPassengers(Long tripId, String cancellationReason) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found: " + tripId
                        )
                );

        // Prevent cancelling already cancelled trips
        if (trip.getStatus() == TripStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "This trip has already been cancelled"
            );
        }

        // Find all confirmed bookings for this trip
        List<Booking> confirmedBookings = bookingRepository
                .findByTripIdAndStatus(tripId, BookingStatus.CONFIRMED);

        // Refund each passenger
        for (Booking booking : confirmedBookings) {
            refundBooking(booking, cancellationReason);
        }

        // Mark trip as cancelled
        trip.setStatus(TripStatus.CANCELLED);
        tripRepository.save(trip);
    }

    @Transactional
    private void refundBooking(Booking booking, String cancellationReason) {
        try {
            // Mark booking as cancelled
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancellationReason(cancellationReason);
            bookingRepository.save(booking);

            // Cancel associated ticket and move to past bookings
            ticketRepository.findByBookingId(booking.getId()).ifPresent(ticket -> {
                ticket.setStatus(TicketStatus.CANCELLED);
                ticketRepository.save(ticket);
            });

            // Refund via the original payment method
            refundService.refundBooking(booking.getId());

            // Release all seats from this booking's trip
            releaseSeatsByTrip(booking.getTrip().getId());

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to refund booking " + booking.getId() + ": " + e.getMessage(), e
            );
        }
    }

    @Transactional
    private void releaseSeatsByTrip(Long tripId) {
        List<TripSeat> tripSeats = tripSeatRepository.findByTripId(tripId);
        for (TripSeat tripSeat : tripSeats) {
            tripSeat.setStatus(TripSeatStatus.AVAILABLE);
            tripSeat.setHeldUntil(null);
        }
    }
}
