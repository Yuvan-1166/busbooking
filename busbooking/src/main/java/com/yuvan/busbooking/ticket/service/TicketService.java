package com.yuvan.busbooking.ticket.service;

import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.ticket.dto.TicketResponse;
import com.yuvan.busbooking.ticket.entity.Ticket;
import com.yuvan.busbooking.ticket.entity.TicketStatus;
import com.yuvan.busbooking.ticket.repository.TicketRepository;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.route.entity.RouteStop;
import com.yuvan.busbooking.route.repository.RouteStopRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

        private final TicketRepository ticketRepository;
        private final BookingRepository bookingRepository;
        private final BookingPassengerRepository bookingPassengerRepository;
        private final RouteStopRepository routeStopRepository;
        private final UserRepository userRepository;

        public TicketService(
                        TicketRepository ticketRepository,
                        BookingRepository bookingRepository,
                        BookingPassengerRepository bookingPassengerRepository,
                        RouteStopRepository routeStopRepository,
                        UserRepository userRepository
                ) {
                this.ticketRepository = ticketRepository;
                this.bookingRepository = bookingRepository;
                this.bookingPassengerRepository = bookingPassengerRepository;
                this.routeStopRepository = routeStopRepository;
                this.userRepository = userRepository;
        }

        @Transactional
        public TicketResponse generateTicket(Long bookingId) {

                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Booking not found: " + bookingId));

                if (booking.getStatus() != BookingStatus.CONFIRMED) {
                        throw new IllegalStateException(
                                        "Ticket can only be generated for a confirmed booking");
                }

                if (ticketRepository.existsByBookingId(bookingId)) {
                        throw new IllegalStateException(
                                        "Ticket already exists for booking: " + bookingId);
                }

                Ticket ticket = new Ticket();

                ticket.setBooking(booking);
                ticket.setTicketNumber(generateTicketNumber());
                ticket.setStatus(TicketStatus.ACTIVE);
                ticket.setExpiresAt(calculateExpirationTime(booking));

                Ticket savedTicket = ticketRepository.save(ticket);

                return toResponse(savedTicket);
        }

        @Transactional(readOnly = true)
        public List<TicketResponse>  findTicketsByUser() {
                List<TicketResponse> tickets = new ArrayList<>();

                String email = SecurityUtils.getCurrentUserEmail();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "User not found"
                                        )
                                );
                
                List<Booking> bookings = bookingRepository.findByUserId(user.getId());

                for(Booking booking : bookings) {
                        
                        // Include both CONFIRMED and CANCELLED bookings
                        if(booking.getStatus().equals(BookingStatus.CONFIRMED) || 
                           booking.getStatus().equals(BookingStatus.CANCELLED)){
                                Ticket ticket = ticketRepository.findByBookingId(booking.getId())
                                                .orElseThrow(
                                                        () -> new ResourceNotFoundException(
                                                                "Ticket Not found"
                                                        )
                                                );
                                tickets.add(toResponse(ticket));
                        }
                }

                return tickets;
        }

        @Transactional(readOnly = true)
        public TicketResponse getTicketByBookingId(Long bookingId) throws AccessDeniedException{

                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "Booking not found: " + bookingId
                                        )
                                );

                String email = SecurityUtils.getCurrentUserEmail();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "User not found"
                                        )
                                );

                if(!user.getId().equals(booking.getUser().getId()))
                        throw new AccessDeniedException(
                                "User Do not have access for this Ticket"
                        );

                Ticket ticket = ticketRepository.findByBookingId(bookingId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Ticket not found for booking: " + bookingId));

                updateExpirationIfNecessary(ticket);

                return toResponse(ticket);
        }

        @Transactional(readOnly = true)
        public TicketResponse getTicketByNumber(String ticketNumber) throws AccessDeniedException {

                String email = SecurityUtils.getCurrentUserEmail();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "User not found"
                                        )
                                );

                Ticket ticket = ticketRepository.findByTicketNumber(ticketNumber)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Ticket not found: " + ticketNumber));

                Booking booking = bookingRepository.findById(ticket.getBooking().getId())
                                .orElseThrow(
                                        () -> new ResourceNotFoundException(
                                                "Booking Not found"
                                        )
                                );

                if(!user.getId().equals(booking.getUser().getId()))
                        throw new AccessDeniedException(
                                "User Do Not have access for this Ticket"
                        );

                updateExpirationIfNecessary(ticket);

                return toResponse(ticket);
        }

        private LocalDateTime calculateExpirationTime(Booking booking) {

                Trip trip = booking.getTrip();

                RouteStop dropStop = routeStopRepository
                                .findByRouteIdAndLocationId(
                                                trip.getRoute().getId(),
                                                booking.getDropLocation().getId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Drop location is not a stop on this route"));

                LocalDateTime departureDateTime = LocalDateTime.of(
                                trip.getTripDate(),
                                trip.getDepartureTime());

                return departureDateTime.plusMinutes(
                                dropStop.getArrivalOffsetMinutes());
        }

        private void updateExpirationIfNecessary(Ticket ticket) {

                if (ticket.getStatus() == TicketStatus.ACTIVE
                                && !LocalDateTime.now().isBefore(ticket.getExpiresAt())) {

                        ticket.setStatus(TicketStatus.EXPIRED);
                        ticketRepository.save(ticket);
                }
        }

        private String generateTicketNumber() {
                return "TKT-" +
                                UUID.randomUUID()
                                                .toString()
                                                .replace("-", "")
                                                .substring(0, 12)
                                                .toUpperCase();
        }

        private TicketResponse toResponse(Ticket ticket) {

                Booking booking = ticket.getBooking();

                List<BookingPassengerResponse> passengers = bookingPassengerRepository
                                .findByBookingId(booking.getId())
                                .stream()
                                .map(passenger -> new BookingPassengerResponse(
                                                passenger.getId(),
                                                passenger.getTripSeat().getId(),
                                                passenger.getTripSeat().getSeat().getSeatNumber(),
                                                passenger.getFirstName(),
                                                passenger.getLastName(),
                                                passenger.getAge(),
                                                passenger.getGender()))
                                .toList();

                return new TicketResponse(
                                ticket.getId(),
                                booking.getId(),
                                ticket.getTicketNumber(),
                                booking.getBookingReference(),
                                booking.getUser().getId(),
                                booking.getTrip().getId(),
                                booking.getTrip().getTripDate(),
                                booking.getTrip().getDepartureTime(),
                                booking.getPickupLocation().getId(),
                                booking.getDropLocation().getId(),
                                booking.getTotalAmount(),
                                passengers,
                                ticket.getIssuedAt(),
                                ticket.getExpiresAt(),
                                ticket.getStatus(),
                                booking.getCancellationReason()
                        );
        }
}