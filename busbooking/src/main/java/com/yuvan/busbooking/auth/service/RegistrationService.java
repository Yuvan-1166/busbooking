package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.registration.RegistrationStrategy;
import com.yuvan.busbooking.auth.registration.RegistrationStrategyFactory;
import org.springframework.stereotype.Service;

/**
 * Facade that exposes the unified account-registration API. It resolves the
 * {@link RegistrationStrategy} for the requested {@code userType} via
 * {@link RegistrationStrategyFactory} and delegates the flow to it.
 */
@Service
public class RegistrationService {

    private final RegistrationStrategyFactory strategyFactory;

    public RegistrationService(RegistrationStrategyFactory strategyFactory) {
        this.strategyFactory = strategyFactory;
    }

    /**
     * Registers a new user account of the requested type (PASSENGER or OPERATOR).
     */
    public RegisterResponse register(RegisterRequest request) {
        return resolve(request).register(request);
    }

    private RegistrationStrategy resolve(RegisterRequest request) {
        return strategyFactory.getStrategy(request.userType());
    }
}