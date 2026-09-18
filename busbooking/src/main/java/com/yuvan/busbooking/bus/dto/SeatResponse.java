package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.Seat;
import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.entity.SeatPosition;
import com.yuvan.busbooking.bus.entity.SeatType;

import java.time.LocalDateTime;

public record SeatResponse(
        Long id,
        Long busId,
        String seatNumber,
        Integer deckNumber,
        String deckName,
        SeatType seatType,
        SeatPosition position,
        SeatGenderPolicy genderPolicy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static SeatResponse fromEntity(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getBus().getId(),
                seat.getSeatNumber(),
                seat.getDeckNumber(),
                seat.getDeckName(),
                seat.getSeatType(),
                seat.getPosition(),
                seat.getGenderPolicy(),
                seat.getCreatedAt(),
                seat.getUpdatedAt()
        );
    }
}