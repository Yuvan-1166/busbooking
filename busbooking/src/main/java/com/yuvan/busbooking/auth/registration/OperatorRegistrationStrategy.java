package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.service.OtpService;
import com.yuvan.busbooking.operator.dto.OperatorRequest;
import com.yuvan.busbooking.operator.dto.OperatorResponse;
import com.yuvan.busbooking.operator.entity.OperatorStatus;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.operator.service.OperatorService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.service.UserService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registration strategy for operator accounts: links the operator profile,
 * assigns the OPERATOR role, and provisions the active operator record.
 */
@Service
public class OperatorRegistrationStrategy extends AbstractRegistrationStrategy {

    private final OperatorRepository operatorRepository;
    private final OperatorService operatorService;

    public OperatorRegistrationStrategy(
            UserService userService,
            OtpService otpService,
            OperatorRepository operatorRepository,
            OperatorService operatorService
    ) {
        super(userService, otpService);
        this.operatorRepository = operatorRepository;
        this.operatorService = operatorService;
    }

    @Override
    public RegistrationType getType() {
        return RegistrationType.OPERATOR;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (request.operatorName() == null || request.operatorName().isBlank()) {
            throw new IllegalArgumentException("Operator name is required");
        }
        if (request.registrationNumber() == null || request.registrationNumber().isBlank()) {
            throw new IllegalArgumentException("Registration number is required");
        }
        if (request.contactPhone() == null || request.contactPhone().isBlank()) {
            throw new IllegalArgumentException("Contact phone is required");
        }

        if (operatorRepository.existsByRegistrationNumber(
                request.registrationNumber())) {
            throw new IllegalStateException(
                    "Operator registration number already exists");
        }

        // Operator also starts PENDING_VERIFICATION
        User user = createPendingUser(request);

        OperatorResponse operatorResponse = operatorService.create(
                new OperatorRequest(
                        user.getId(),
                        request.operatorName(),
                        request.registrationNumber(),
                        user.getEmail(),
                        request.contactPhone(),
                        OperatorStatus.ACTIVE
                ));

        sendVerificationOtp(user);

        return new RegisterResponse(
                user.getId(),
                operatorResponse.id(),
                user.getEmail(),
                user.getFirstName(),
                operatorResponse.name(),
                "Operator registration successful. Check your email for a verification code."
        );
    }
}