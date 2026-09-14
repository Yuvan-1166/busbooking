package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.SeatHoldStatus;

import java.time.LocalDateTime;
import java.util.List;

public record SeatHoldResponse(
        Long id,
        Long userId,
        Long tripId,
        List<Long> tripSeatIds,
        SeatHoldStatus status,
        LocalDateTime heldAt,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
        
) {}