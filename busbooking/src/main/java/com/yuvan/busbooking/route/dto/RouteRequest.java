package com.yuvan.busbooking.route.dto;

import com.yuvan.busbooking.route.entity.RouteStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RouteRequest(

        @NotBlank
        @Size(max = 150)
        String name,

        RouteStatus status
) {
}