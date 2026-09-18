package com.yuvan.busbooking.bus.dto;

import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.entity.SeatPosition;
import com.yuvan.busbooking.bus.entity.SeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SeatRequest(

        @NotNull
        Long busId,

        @NotBlank
        @Size(max = 20)
        String seatNumber,

        Integer deckNumber,

        @Size(max = 50)
        String deckName,

        @NotNull
        SeatType seatType,

        @NotNull
        SeatPosition position,

        /**
         * Gender policy for this seat.
         * Defaults to {@code ANY} when not provided.
         */
        SeatGenderPolicy genderPolicy
) {
}