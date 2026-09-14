package com.yuvan.busbooking.operator.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.operator.dto.OperatorRequest;
import com.yuvan.busbooking.operator.dto.OperatorResponse;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.entity.OperatorStatus;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OperatorService {

    private final OperatorRepository operatorRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    public OperatorService(
            OperatorRepository operatorRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.operatorRepository = operatorRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
    }

    public OperatorResponse create(OperatorRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + request.userId()
                        )
                );

        if (operatorRepository.existsByUserId(request.userId())) {
            throw new IllegalArgumentException(
                    "User already has an operator profile"
            );
        }

        if (operatorRepository.existsByRegistrationNumber(
                request.registrationNumber()
        )) {
            throw new IllegalArgumentException(
                    "Registration number already exists"
            );
        }

        Operator operator = new Operator();

        operator.setUser(user);
        operator.setName(request.name());
        operator.setRegistrationNumber(request.registrationNumber());
        operator.setContactEmail(request.contactEmail());
        operator.setContactPhone(request.contactPhone());

        operator.setStatus(
                request.status() != null
                        ? request.status()
                        : OperatorStatus.DEACTIVE
        );

        Role operatorRole = roleRepository.findByName(RoleName.OPERATOR)
                                .orElseThrow(
                                        () -> new IllegalStateException(
                                                "Operator role not initialized"
                                        )
                                );
        UserRole userRole = new UserRole();

        userRole.setUser(user);
        userRole.setRole(operatorRole);
        userRoleRepository.save(userRole);

        return toResponse(operatorRepository.save(operator));
    }

    public OperatorResponse createOperator(OperatorRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + request.userId()
                        )
                );

        if (operatorRepository.existsByUserId(request.userId())) {
            throw new IllegalArgumentException(
                    "User already has an operator profile"
            );
        }

        if (operatorRepository.existsByRegistrationNumber(
                request.registrationNumber()
        )) {
            throw new IllegalArgumentException(
                    "Registration number already exists"
            );
        }

        Operator operator = new Operator();

        operator.setUser(user);
        operator.setName(request.name());
        operator.setRegistrationNumber(request.registrationNumber());
        operator.setContactEmail(request.contactEmail());
        operator.setContactPhone(request.contactPhone());

        operator.setStatus(
                request.status() != null
                        ? request.status()
                        : OperatorStatus.DEACTIVE
        );

        Role operatorRole = roleRepository.findByName(RoleName.OPERATOR)
                                .orElseThrow(
                                        () -> new IllegalStateException(
                                                "Operator role not initialized"
                                        )
                                );
        UserRole userRole = new UserRole();

        userRole.setUser(user);
        userRole.setRole(operatorRole);
        userRoleRepository.save(userRole);

        return toResponse(operatorRepository.save(operator));
    }

    @Transactional(readOnly = true)
    public List<OperatorResponse> findAll() {

        return operatorRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OperatorResponse findById(Long id) {

        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Operator not found: " + id
                        )
                );

        return toResponse(operator);
    }

    public OperatorResponse update(
            Long id,
            OperatorRequest request
    ) {

        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Operator not found: " + id
                        )
                );

        if (!operator.getRegistrationNumber()
                .equals(request.registrationNumber())
                && operatorRepository.existsByRegistrationNumber(
                        request.registrationNumber()
                )) {

            throw new IllegalArgumentException(
                    "Registration number already exists"
            );
        }

        operator.setName(request.name());
        operator.setRegistrationNumber(request.registrationNumber());
        operator.setContactEmail(request.contactEmail());
        operator.setContactPhone(request.contactPhone());

        if (request.status() != null) {
            operator.setStatus(request.status());
        }

        return toResponse(operatorRepository.save(operator));
    }

    public void delete(Long id) {

        if (!operatorRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Operator not found: " + id
            );
        }

        operatorRepository.deleteById(id);
    }

    private OperatorResponse toResponse(Operator operator) {

        return new OperatorResponse(
                operator.getId(),
                operator.getUser().getId(),
                operator.getName(),
                operator.getRegistrationNumber(),
                operator.getContactEmail(),
                operator.getContactPhone(),
                operator.getStatus(),
                operator.getCreatedAt(),
                operator.getUpdatedAt()
        );
    }
    
}