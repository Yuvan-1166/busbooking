package com.yuvan.busbooking.trip.service;

import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.trip.dto.TripSeatResponse;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TripSeatService {

    private final TripSeatRepository tripSeatRepository;

    public TripSeatService(TripSeatRepository tripSeatRepository) {
        this.tripSeatRepository = tripSeatRepository;
    }

    public List<TripSeatResponse> getSeatsByTrip(Long tripId) {
        return tripSeatRepository.findByTripId(tripId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TripSeatResponse getTripSeat(Long id) {
        TripSeat tripSeat = tripSeatRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found with id: " + id
                        )
                );

        return toResponse(tripSeat);
    }

    private TripSeatResponse toResponse(TripSeat tripSeat) {
        SeatGenderPolicy policy = tripSeat.getSeat().getGenderPolicy();

        return new TripSeatResponse(
                tripSeat.getId(),
                tripSeat.getTrip().getId(),
                tripSeat.getSeat().getId(),
                tripSeat.getSeat().getSeatNumber(),
                tripSeat.getStatus(),
                policy != null ? policy : SeatGenderPolicy.ANY,
                tripSeat.getHeldUntil(),
                tripSeat.getCreatedAt(),
                tripSeat.getUpdatedAt()
        );
    }
    
}