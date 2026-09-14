package com.yuvan.busbooking.route.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RouteStopRequest(

        @NotNull
        Long routeId,

        @NotNull
        Long locationId,

        @NotNull
        @Min(1)
        Integer stopOrder,

        @Min(0)
        Integer arrivalOffsetMinutes,

        @Min(0)
        Integer departureOffsetMinutes,

        @NotNull
        @DecimalMin(value = "0.0")
        BigDecimal distanceFromOriginKm
) {
}