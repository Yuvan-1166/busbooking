package com.yuvan.busbooking.booking.dto;

import com.yuvan.busbooking.booking.entity.Gender;

import jakarta.validation.constraints.*;

public record BookingPassengerRequest(
    @NotNull
    Long tripSeatId,
    
    @NotBlank 
    @Size(max = 100)
    String firstName,

    @NotBlank 
    @Size(max = 100)
    String lastName,

    @NotNull 
    @Min(1)
    @Max(120)
    Integer age,

    @NotNull
    Gender gender
) {}