package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;

/**
 * Strategy that encapsulates the complete account-registration flow for one
 * account type (Passenger or Operator), resolved through a single
 * {@code POST /auth/register} endpoint keyed on {@link #getType()}.
 *
 * <p>Implementations are Spring beans discovered automatically by
 * {@link RegistrationStrategyFactory}. Adding support for a new account type
 * is a single new bean with zero changes to the controller, facade, or
 * factory.</p>
 */
public interface RegistrationStrategy {

    /**
     * @return the account type this strategy implements.
     */
    RegistrationType getType();

    /**
     * Registers a new user account of this strategy's type.
     *
     * @param request unified registration payload.
     * @return the registration confirmation (user id, type-specific fields).
     */
    RegisterResponse register(RegisterRequest request);
}