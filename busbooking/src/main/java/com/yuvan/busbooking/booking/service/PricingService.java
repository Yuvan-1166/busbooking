package com.yuvan.busbooking.booking.service;

import com.yuvan.busbooking.trip.entity.Trip;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PricingService {

    public BigDecimal calculateFare(
            Trip trip,
            BigDecimal pickupDistance,
            BigDecimal dropDistance,
            int numberOfSeats
    ) {

        if (dropDistance.compareTo(pickupDistance) <= 0) {
            throw new IllegalArgumentException(
                    "Drop location must come after pickup location"
            );
        }

        BigDecimal journeyDistance =
                dropDistance.subtract(pickupDistance);

        BigDecimal distanceFare =
                journeyDistance.multiply(trip.getPricePerKm());

        BigDecimal farePerSeat =
                trip.getBaseFare().add(distanceFare);

        return farePerSeat
                .multiply(BigDecimal.valueOf(numberOfSeats))
                .setScale(2, RoundingMode.HALF_UP);
    }
}