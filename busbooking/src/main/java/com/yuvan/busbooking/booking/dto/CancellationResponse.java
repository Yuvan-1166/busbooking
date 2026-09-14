package com.yuvan.busbooking.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CancellationResponse(
        Long id,
        Long bookingId,
        String bookingReference,
        String reason,
        BigDecimal refundAmount,
        LocalDateTime cancelledAt
) {}