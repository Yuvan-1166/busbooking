package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.Gender;

public record BookingPassengerResponse(
        Long id,
        Long tripSeatId,
        String seatNumber,
        String firstName,
        String lastName,
        Integer age,
        Gender gender
) {}