package com.yuvan.busbooking.trip.service;

import com.yuvan.busbooking.bus.entity.Seat;
import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.repository.SeatRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.trip.dto.TripSeatRequest;
import com.yuvan.busbooking.trip.dto.TripSeatResponse;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TripSeatService {

    private final TripSeatRepository tripSeatRepository;
    private final TripRepository tripRepository;
    private final SeatRepository seatRepository;

    public TripSeatService(
            TripSeatRepository tripSeatRepository,
            TripRepository tripRepository,
            SeatRepository seatRepository
    ) {
        this.tripSeatRepository = tripSeatRepository;
        this.tripRepository = tripRepository;
        this.seatRepository = seatRepository;
    }

    @Transactional(readOnly = true)
    public List<TripSeatResponse> getSeatsByTrip(Long tripId) {
        return tripSeatRepository.findByTripId(tripId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripSeatResponse getTripSeat(Long id) {
        TripSeat tripSeat = tripSeatRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found with id: " + id
                        )
                );

        return toResponse(tripSeat);
    }

    @Transactional(readOnly = true)
    public List<TripSeatResponse> findAll() {
        return tripSeatRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TripSeatResponse create(TripSeatRequest request) {

        if (tripSeatRepository.existsByTripIdAndSeatId(
                request.tripId(),
                request.seatId()
        )) {
            throw new IllegalArgumentException(
                    "A trip seat already exists for this trip and seat"
            );
        }

        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found with id: " + request.tripId()
                        )
                );

        Seat seat = seatRepository.findById(request.seatId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found with id: " + request.seatId()
                        )
                );

        TripSeat tripSeat = new TripSeat();

        tripSeat.setTrip(trip);
        tripSeat.setSeat(seat);
        tripSeat.setStatus(request.status() != null
                ? request.status()
                : TripSeatStatus.AVAILABLE);

        return toResponse(tripSeatRepository.save(tripSeat));
    }

    public TripSeatResponse update(
            Long id,
            TripSeatRequest request
    ) {

        TripSeat tripSeat = tripSeatRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found with id: " + id
                        )
                );

        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found with id: " + request.tripId()
                        )
                );

        Seat seat = seatRepository.findById(request.seatId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found with id: " + request.seatId()
                        )
                );

        tripSeat.setTrip(trip);
        tripSeat.setSeat(seat);

        if (request.status() != null) {
            tripSeat.setStatus(request.status());
        }

        return toResponse(tripSeatRepository.save(tripSeat));
    }

    public void delete(Long id) {

        if (!tripSeatRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Trip seat not found with id: " + id
            );
        }

        tripSeatRepository.deleteById(id);
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