package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.dto.BusRequest;
import com.yuvan.busbooking.bus.dto.BusResponse;
import com.yuvan.busbooking.bus.entity.Bus;
import com.yuvan.busbooking.bus.entity.BusStatus;
import com.yuvan.busbooking.bus.repository.BusRepository;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BusService {

    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;
    private final UserRepository userRepository;

    public BusService(
            BusRepository busRepository,
            OperatorRepository operatorRepository,
            UserRepository userRepository
    ) {
        this.busRepository = busRepository;
        this.operatorRepository = operatorRepository;
        this.userRepository = userRepository;
    }

    public BusResponse create(BusRequest request) {

        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> 
                                new ResourceNotFoundException("User not fount")
                );
        Operator operator = operatorRepository.findByUserId(user.getId())
                        .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Operator not found"
                        )
                );

        if (busRepository.existsByRegistrationNumber(
                request.registrationNumber()
        )) {
            throw new IllegalArgumentException(
                    "Registration number already exists"
            );
        }

        Bus bus = new Bus();

        bus.setOperator(operator);
        bus.setRegistrationNumber(request.registrationNumber());
        bus.setModel(request.model());
        bus.setBusType(request.busType());
        bus.setStatus(
                request.status() != null
                        ? request.status()
                        : BusStatus.ACTIVE
        );

        return toResponse(busRepository.save(bus));
    }

    @Transactional(readOnly = true)
    public List<BusResponse> findAll() {

        // Operators see only their own buses; admins/passengers see all
        if (SecurityUtils.hasRole("OPERATOR")) {
            String email = SecurityUtils.getCurrentUserEmail();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("User not found")
                    );

            return operatorRepository.findByUserId(user.getId())
                    .map(operator ->
                            busRepository.findByOperatorId(operator.getId())
                                    .stream()
                                    .map(this::toResponse)
                                    .toList()
                    )
                    .orElse(List.of());
        }

        return busRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BusResponse findById(Long id) {

        Bus bus = busRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + id
                        )
                );

        return toResponse(bus);
    }

    @Transactional(readOnly = true)
    public List<BusResponse> findByOperator(Long operatorId) {

        if (!operatorRepository.existsById(operatorId)) {
            throw new ResourceNotFoundException(
                    "Operator not found: " + operatorId
            );
        }

        return busRepository.findByOperatorId(operatorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BusResponse update(Long id, BusRequest request) {

        Bus bus = busRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bus not found: " + id
                        )
                );

        if (!bus.getRegistrationNumber()
                .equals(request.registrationNumber())
                && busRepository.existsByRegistrationNumber(
                        request.registrationNumber()
                )) {

            throw new IllegalArgumentException(
                    "Registration number already exists"
            );
        }

        String email = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(email)
                                .orElseThrow( () -> 
                                        new ResourceNotFoundException(
                                                "User not found"
                                        )
                                );

        Operator operator = operatorRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Operator not found"
                        )
                );

        bus.setOperator(operator);
        bus.setRegistrationNumber(request.registrationNumber());
        bus.setModel(request.model());
        bus.setBusType(request.busType());

        if (request.status() != null) {
            bus.setStatus(request.status());
        }

        return toResponse(busRepository.save(bus));
    }

    public void delete(Long id) {

        if (!busRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Bus not found: " + id
            );
        }

        busRepository.deleteById(id);
    }

    private BusResponse toResponse(Bus bus) {

        return new BusResponse(
                bus.getId(),
                bus.getOperator().getId(),
                bus.getRegistrationNumber(),
                bus.getModel(),
                bus.getBusType(),
                bus.getStatus(),
                bus.getCreatedAt(),
                bus.getUpdatedAt()
        );
    }
    
}