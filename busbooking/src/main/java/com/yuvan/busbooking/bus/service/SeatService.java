package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.dto.SeatRequest;
import com.yuvan.busbooking.bus.dto.SeatResponse;
import com.yuvan.busbooking.bus.entity.Bus;
import com.yuvan.busbooking.bus.entity.Seat;
import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.repository.BusRepository;
import com.yuvan.busbooking.bus.repository.SeatRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SeatService {

    private final SeatRepository seatRepository;
    private final BusRepository busRepository;

    public SeatService(
            SeatRepository seatRepository,
            BusRepository busRepository
    ) {
        this.seatRepository = seatRepository;
        this.busRepository = busRepository;
    }

    public SeatResponse create(SeatRequest request) {

        Bus bus = busRepository.findById(request.busId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + request.busId()
                        )
                );

        if (seatRepository.existsByBusIdAndSeatNumber(
                request.busId(),
                request.seatNumber()
        )) {
            throw new IllegalArgumentException(
                    "Seat number already exists for this bus"
            );
        }

        Seat seat = new Seat();

        seat.setBus(bus);
        seat.setSeatNumber(request.seatNumber());
        seat.setSeatType(request.seatType());
        seat.setPosition(request.position());
        seat.setGenderPolicy(
                request.genderPolicy() != null
                        ? request.genderPolicy()
                        : SeatGenderPolicy.ANY
        );

        return toResponse(seatRepository.save(seat));
    }

    @Transactional(readOnly = true)
    public List<SeatResponse> findByBus(Long busId) {

        if (!busRepository.existsById(busId)) {
            throw new ResourceNotFoundException(
                    "Bus not found: " + busId
            );
        }

        return seatRepository.findByBusIdOrderBySeatNumber(busId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeatResponse findById(Long id) {

        Seat seat = seatRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found: " + id
                        )
                );

        return toResponse(seat);
    }

    public SeatResponse update(
            Long id,
            SeatRequest request
    ) {

        Seat seat = seatRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat not found: " + id
                        )
                );

        Bus bus = busRepository.findById(request.busId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + request.busId()
                        )
                );

        if ((!seat.getBus().getId().equals(request.busId())
                || !seat.getSeatNumber().equals(request.seatNumber()))
                && seatRepository.existsByBusIdAndSeatNumber(
                        request.busId(),
                        request.seatNumber()
                )) {

            throw new IllegalArgumentException(
                    "Seat number already exists for this bus"
            );
        }

        seat.setBus(bus);
        seat.setSeatNumber(request.seatNumber());
        seat.setSeatType(request.seatType());
        seat.setPosition(request.position());
        seat.setGenderPolicy(
                request.genderPolicy() != null
                        ? request.genderPolicy()
                        : SeatGenderPolicy.ANY
        );

        return toResponse(seatRepository.save(seat));
    }

    public void delete(Long id) {

        if (!seatRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Seat not found: " + id
            );
        }

        seatRepository.deleteById(id);
    }

    private SeatResponse toResponse(Seat seat) {

        return new SeatResponse(
                seat.getId(),
                seat.getBus().getId(),
                seat.getSeatNumber(),
                seat.getSeatType(),
                seat.getPosition(),
                seat.getGenderPolicy() != null
                        ? seat.getGenderPolicy()
                        : SeatGenderPolicy.ANY,
                seat.getCreatedAt(),
                seat.getUpdatedAt()
        );
    }
    
}