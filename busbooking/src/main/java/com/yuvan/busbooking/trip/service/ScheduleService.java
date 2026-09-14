package com.yuvan.busbooking.trip.service;

import com.yuvan.busbooking.bus.entity.Bus;
import com.yuvan.busbooking.bus.repository.BusRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.route.entity.Route;
import com.yuvan.busbooking.route.repository.RouteRepository;
import com.yuvan.busbooking.trip.dto.ScheduleRequest;
import com.yuvan.busbooking.trip.dto.ScheduleResponse;
import com.yuvan.busbooking.trip.entity.Schedule;
import com.yuvan.busbooking.trip.entity.ScheduleStatus;
import com.yuvan.busbooking.trip.repository.ScheduleRepository;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final RouteRepository routeRepository;
    private final BusRepository busRepository;
    private final UserRepository userRepository;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            RouteRepository routeRepository,
            BusRepository busRepository,
            UserRepository userRepository
    ) {
        this.scheduleRepository = scheduleRepository;
        this.routeRepository = routeRepository;
        this.busRepository = busRepository;
        this.userRepository = userRepository;
    }

    public ScheduleResponse create(ScheduleRequest request) {

        Route route = routeRepository.findById(request.routeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + request.routeId()
                        )
                );

        Bus bus = busRepository.findById(request.busId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + request.busId()
                        )
                );

        Schedule schedule = new Schedule();

        schedule.setRoute(route);
        schedule.setBus(bus);
        schedule.setDepartureTime(request.departureTime());
        schedule.setEffectiveFrom(request.effectiveFrom());
        schedule.setEffectiveUntil(request.effectiveUntil());
        schedule.setOperatingDays(request.operatingDays());

        schedule.setStatus(
                request.status() != null
                        ? request.status()
                        : ScheduleStatus.ACTIVE
        );

        schedule.setBaseFare(request.baseFare());
        schedule.setPricePerKm(request.pricePerKm());

        return toResponse(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findAll() {

        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "User Not found"
                                )
                        );

        if(SecurityUtils.hasRole(RoleName.OPERATOR.toString())) {
                return scheduleRepository.findByBusOperatorUserId(user.getId())
                        .stream()
                        .map(this::toResponse)
                        .toList();
        }
        else {
                return scheduleRepository.findAll()
                        .stream()
                        .map(this::toResponse)
                        .toList();
        }
    }

    @Transactional(readOnly = true)
    public ScheduleResponse findById(Long id) {

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Schedule not found: " + id
                        )
                );

        return toResponse(schedule);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findByRoute(Long routeId) {

        if (!routeRepository.existsById(routeId)) {
            throw new ResourceNotFoundException(
                    "Route not found: " + routeId
            );
        }

        return scheduleRepository.findByRouteId(routeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findByBus(Long busId) {

        if (!busRepository.existsById(busId)) {
            throw new ResourceNotFoundException(
                    "Bus not found: " + busId
            );
        }

        return scheduleRepository.findByBusId(busId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ScheduleResponse update(
            Long id,
            ScheduleRequest request
    ) {

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Schedule not found: " + id
                        )
                );

        Route route = routeRepository.findById(request.routeId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Route not found: " + request.routeId()
                        )
                );

        Bus bus = busRepository.findById(request.busId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + request.busId()
                        )
                );

        schedule.setRoute(route);
        schedule.setBus(bus);
        schedule.setDepartureTime(request.departureTime());
        schedule.setEffectiveFrom(request.effectiveFrom());
        schedule.setEffectiveUntil(request.effectiveUntil());
        schedule.setOperatingDays(request.operatingDays());
        schedule.setBaseFare(request.baseFare());
        schedule.setPricePerKm(request.pricePerKm());

        if (request.status() != null) {
            schedule.setStatus(request.status());
        }

        return toResponse(scheduleRepository.save(schedule));
    }

    public void delete(Long id) {

        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Schedule not found: " + id
            );
        }

        scheduleRepository.deleteById(id);
    }

    private ScheduleResponse toResponse(Schedule schedule) {

        return new ScheduleResponse(
                schedule.getId(),
                schedule.getRoute().getId(),
                schedule.getBus().getId(),
                schedule.getDepartureTime(),
                schedule.getEffectiveFrom(),
                schedule.getEffectiveUntil(),
                schedule.getOperatingDays(),
                schedule.getBaseFare(),
                schedule.getPricePerKm(),
                schedule.getStatus(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
    
}