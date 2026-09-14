package com.yuvan.busbooking.ticket.entity;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.yuvan.busbooking.ticket.repository.TicketRepository;

import jakarta.transaction.Transactional;

@Component
public class TicketExpirationScheduler {

    private final TicketRepository ticketRepository;

    public TicketExpirationScheduler(
            TicketRepository ticketRepository
    ) {
        this.ticketRepository = ticketRepository;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expireTickets() {

        List<Ticket> tickets =
                ticketRepository.findTicketsToExpire(
                        TicketStatus.ACTIVE,
                        LocalDateTime.now()
                );

        tickets.forEach(ticket ->
                ticket.setStatus(TicketStatus.EXPIRED)
        );

        ticketRepository.saveAll(tickets);
    }
}