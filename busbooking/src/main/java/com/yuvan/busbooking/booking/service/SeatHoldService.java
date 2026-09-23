package com.yuvan.busbooking.booking.service;

import com.yuvan.busbooking.booking.dto.SeatHoldItem;
import com.yuvan.busbooking.booking.dto.SeatHoldRequest;
import com.yuvan.busbooking.booking.dto.SeatHoldResponse;
import com.yuvan.busbooking.booking.dto.SeatHoldUpdateRequest;
import com.yuvan.busbooking.booking.entity.Gender;
import com.yuvan.busbooking.booking.entity.SeatHold;
import com.yuvan.busbooking.booking.entity.SeatHoldStatus;
import com.yuvan.busbooking.booking.repository.SeatHoldRepository;
import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SeatHoldService {

    private static final long HOLD_DURATION_MINUTES = 10;

    private final SeatHoldRepository seatHoldRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final TripSeatRepository tripSeatRepository;

    public SeatHoldService(
            SeatHoldRepository seatHoldRepository,
            UserRepository userRepository,
            TripRepository tripRepository,
            TripSeatRepository tripSeatRepository
    ) {
        this.seatHoldRepository = seatHoldRepository;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.tripSeatRepository = tripSeatRepository;
    }

    @Transactional
    public List<SeatHoldResponse> holdSeats(
            Long userId,
            SeatHoldRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        Trip trip = tripRepository.findById(request.tripId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip not found with id: " + request.tripId()
                        )
                );

        validateDuplicateSeats(request.seats());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(HOLD_DURATION_MINUTES);

        List<SeatHold> holds = request.seats()
                .stream()
                .map(item -> createHold(user, trip, item, now, expiresAt))
                .toList();

        return seatHoldRepository.saveAll(holds)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private SeatHold createHold(
            User user,
            Trip trip,
            SeatHoldItem item,
            LocalDateTime heldAt,
            LocalDateTime expiresAt
    ) {

        TripSeat tripSeat = tripSeatRepository
                .findByIdAndTripId(item.tripSeatId(), trip.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Trip seat not found for this trip: " + item.tripSeatId()
                        )
                );

        if (tripSeat.getStatus() != TripSeatStatus.AVAILABLE) {
            throw new IllegalArgumentException(
                    "Trip seat " + item.tripSeatId() + " is not available"
            );
        }

        seatHoldRepository
                .findByTripSeatIdAndStatus(item.tripSeatId(), SeatHoldStatus.ACTIVE)
                .ifPresent(existingHold -> {
                    throw new IllegalArgumentException(
                            "Trip seat " + item.tripSeatId() + " is already held"
                    );
                });

        // Enforce gender-reserved seat policies at hold time
        enforceGenderPolicy(tripSeat, item.gender());

        tripSeat.setStatus(TripSeatStatus.HELD);
        tripSeat.setHeldUntil(expiresAt);

        SeatHold seatHold = new SeatHold();

        seatHold.setTripSeat(tripSeat);
        seatHold.setUser(user);
        seatHold.setStatus(SeatHoldStatus.ACTIVE);
        seatHold.setHeldAt(heldAt);
        seatHold.setExpiresAt(expiresAt);

        return seatHold;
    }

    /**
     * Enforces FEMALE_ONLY and MALE_ONLY policies.
     * FEMALE_PREFERRED and MALE_PREFERRED are advisory only — any gender may book them.
     */
    private void enforceGenderPolicy(TripSeat tripSeat, Gender passengerGender) {
        SeatGenderPolicy policy = tripSeat.getSeat().getGenderPolicy();

        if (policy == null || policy == SeatGenderPolicy.ANY
                || policy == SeatGenderPolicy.FEMALE_PREFERRED
                || policy == SeatGenderPolicy.MALE_PREFERRED) {
            return;
        }

        String seatNumber = tripSeat.getSeat().getSeatNumber();

        if (policy == SeatGenderPolicy.FEMALE_ONLY && passengerGender != Gender.FEMALE) {
            throw new IllegalArgumentException(
                    "Seat " + seatNumber + " is reserved for female passengers only"
            );
        }

        if (policy == SeatGenderPolicy.MALE_ONLY && passengerGender != Gender.MALE) {
            throw new IllegalArgumentException(
                    "Seat " + seatNumber + " is reserved for male passengers only"
            );
        }
    }

    private void validateDuplicateSeats(List<SeatHoldItem> items) {
        Set<Long> uniqueSeatIds = new HashSet<>();

        for (SeatHoldItem item : items) {
            if (!uniqueSeatIds.add(item.tripSeatId())) {
                throw new IllegalArgumentException(
                        "The same trip seat cannot be held more than once"
                );
            }
        }
    }

    private SeatHoldResponse toResponse(SeatHold hold) {
        return new SeatHoldResponse(
                hold.getId(),
                hold.getUser().getId(),
                hold.getTripSeat().getTrip().getId(),
                List.of(hold.getTripSeat().getId()),
                hold.getStatus(),
                hold.getHeldAt(),
                hold.getExpiresAt(),
                hold.getCreatedAt(),
                hold.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<SeatHoldResponse> findAll() {
        return seatHoldRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeatHoldResponse> findByUser(Long userId) {
        return seatHoldRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeatHoldResponse findById(Long id) {
        SeatHold hold = seatHoldRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat hold not found with id: " + id
                        )
                );
        return toResponse(hold);
    }

    @Transactional
    public SeatHoldResponse update(
            Long id,
            SeatHoldUpdateRequest request
    ) {
        SeatHold hold = seatHoldRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat hold not found with id: " + id
                        )
                );

        if (request.status() != null) {
            hold.setStatus(request.status());
        }

        if (request.expiresAt() != null) {
            hold.setExpiresAt(request.expiresAt());
        }

        return toResponse(seatHoldRepository.save(hold));
    }

    /**
     * Release a hold and free the underlying trip seat.
     *
     * @param userId when provided (non-admin caller), ownership is enforced.
     */
    @Transactional
    public SeatHoldResponse release(Long id, Long userId) {

        SeatHold hold = seatHoldRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Seat hold not found with id: " + id
                        )
                );

        if (userId != null && !hold.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "This hold does not belong to you"
            );
        }

        if (hold.getStatus() == SeatHoldStatus.ACTIVE) {
            hold.setStatus(SeatHoldStatus.RELEASED);

            TripSeat tripSeat = hold.getTripSeat();

            if (tripSeat.getStatus() == TripSeatStatus.HELD) {
                tripSeat.setStatus(TripSeatStatus.AVAILABLE);
                tripSeat.setHeldUntil(null);
            }
        }

        return toResponse(seatHoldRepository.save(hold));
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireHolds() {
        LocalDateTime now = LocalDateTime.now();

        List<SeatHold> expiredHolds =
                seatHoldRepository.findExpiredHolds(SeatHoldStatus.ACTIVE, now);

        for (SeatHold hold : expiredHolds) {
            TripSeat tripSeat = hold.getTripSeat();

            if (tripSeat.getStatus() == TripSeatStatus.HELD) {
                tripSeat.setStatus(TripSeatStatus.AVAILABLE);
                tripSeat.setHeldUntil(null);
            }

            hold.setStatus(SeatHoldStatus.EXPIRED);
        }
    }

}
