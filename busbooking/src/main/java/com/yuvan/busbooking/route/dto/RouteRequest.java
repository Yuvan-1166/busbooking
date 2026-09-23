package com.yuvan.busbooking.route.dto;

import com.yuvan.busbooking.route.entity.RouteStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record RouteRequest(

        @NotBlank
        @Size(max = 150)
        String name,

        RouteStatus status,

        /**
         * Ordered list of stops making up this route. Order of the list
         * defines the route direction; {@code stopOrder} is derived from
         * position when not supplied.
         */
        @Valid
        List<RouteStopItem> stops
) {

    public record RouteStopItem(

            @NotNull
            Long locationId,

            @Min(1)
            Integer stopOrder,

            @Min(0)
            Integer arrivalOffsetMinutes,

            @Min(0)
            Integer departureOffsetMinutes,

            /**
             * Distance from the origin stop in km. When omitted, it is
             * recomputed automatically from the previous stop's coordinates.
             */
            @DecimalMin(value = "0.0")
            BigDecimal distanceFromOriginKm
    ) {
    }
}