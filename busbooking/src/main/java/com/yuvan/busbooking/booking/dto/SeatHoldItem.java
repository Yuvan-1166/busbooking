package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.Gender;
import jakarta.validation.constraints.NotNull;

/**
 * Represents a single seat selection in a hold request,
 * pairing a trip-seat ID with the intending passenger's gender.
 * The gender is used to enforce FEMALE_ONLY / MALE_ONLY seat policies.
 */
public record SeatHoldItem(

        @NotNull(message = "Trip seat ID is required")
        Long tripSeatId,

        /**
         * Gender of the passenger who will occupy this seat.
         * Required so that gender-reserved seats can be validated at hold time.
         */
        @NotNull(message = "Passenger gender is required")
        Gender gender

) {}
