package com.yuvan.busbooking.trip.dto;

import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.entity.SeatPosition;
import com.yuvan.busbooking.bus.entity.SeatType;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;

import java.time.LocalDateTime;

public record TripSeatResponse(
        Long id,
        Long tripId,
        Long seatId,
        String seatNumber,
        TripSeatStatus status,
        SeatGenderPolicy genderPolicy,
        SeatType seatType,
        SeatPosition position,
        Integer deckNumber,
        String deckName,
        Integer aisleAfter,
        LocalDateTime heldUntil,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}