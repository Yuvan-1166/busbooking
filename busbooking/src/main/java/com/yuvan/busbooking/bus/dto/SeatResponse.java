package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.entity.SeatPosition;
import com.yuvan.busbooking.bus.entity.SeatType;

import java.time.LocalDateTime;

public record SeatResponse(
        Long id,
        Long busId,
        String seatNumber,
        SeatType seatType,
        SeatPosition position,
        SeatGenderPolicy genderPolicy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}