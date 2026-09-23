package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.SeatHoldStatus;

import java.time.LocalDateTime;

public record SeatHoldUpdateRequest(
        SeatHoldStatus status,
        LocalDateTime expiresAt
) {
}