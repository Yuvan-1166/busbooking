package com.yuvan.busbooking.auth.onboarding;

import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;

/**
 * Strategy that encapsulates the role-specific steps of onboarding: assigning
 * the final role, provisioning the wallet (passenger) or the operator profile
 * (operator).
 *
 * <p>Implementations are Spring beans discovered automatically by
 * {@link OnboardingStrategyFactory} keyed on {@link #getRole()}. Adding support
 * for a new role is a single new bean with zero changes to the facade or
 * factory.</p>
 */
public interface OnboardingStrategy {

    /**
     * @return the role this strategy onboards.
     */
    RoleName getRole();

    /**
     * Applies the role-specific onboarding steps for the given user.
     *
     * @param user    the authenticated user completing onboarding.
     * @param request the onboarding payload.
     */
    void apply(User user, OnboardingCompleteRequest request);
}