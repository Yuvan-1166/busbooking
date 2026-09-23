package com.yuvan.busbooking.ticket.dto;

import com.yuvan.busbooking.ticket.entity.TicketStatus;

public record TicketUpdateRequest(
        TicketStatus status
) {
}