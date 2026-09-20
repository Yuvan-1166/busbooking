package com.yuvan.busbooking.auth.registration;

/**
 * Identifies the account type being registered through the unified
 * {@code POST /auth/register} endpoint.
 *
 * <p>Adding a new account type only requires a new enum constant plus a
 * {@link RegistrationStrategy} bean that implements the flow.</p>
 */
public enum RegistrationType {
    PASSENGER,
    OPERATOR
}