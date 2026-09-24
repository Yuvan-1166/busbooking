package com.yuvan.busbooking.ticket.repository;

import com.yuvan.busbooking.ticket.entity.Ticket;
import com.yuvan.busbooking.ticket.entity.TicketStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.*;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByBookingId(Long bookingId);

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    boolean existsByBookingId(Long bookingId);

    boolean existsByTicketNumber(String ticketNumber);

    @Query("""
                SELECT t
                FROM Ticket t
                WHERE t.status = :status
                  AND t.expiresAt <= :now
            """)
    List<Ticket> findTicketsToExpire(
            @Param("status") TicketStatus status,
            @Param("now") LocalDateTime now);

    @Query("""
                SELECT t
                FROM Ticket t
                WHERE t.booking.createdAt BETWEEN :from AND :to
                ORDER BY t.issuedAt
            """)
    List<Ticket> findForAnalytics(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
                SELECT t
                FROM Ticket t
                WHERE t.booking.createdAt BETWEEN :from AND :to
                  AND t.booking.trip.bus.operator.id = :operatorId
                ORDER BY t.issuedAt
            """)
    List<Ticket> findForAnalyticsByOperator(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("operatorId") Long operatorId);
}