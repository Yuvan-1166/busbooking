package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.auth.onboarding.OnboardingStrategy;
import com.yuvan.busbooking.auth.onboarding.OnboardingStrategyFactory;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Facade that exposes the onboarding orchestration API. It resolves the
 * {@link OnboardingStrategy} for the requested role via
 * {@link OnboardingStrategyFactory} and delegates the role-specific steps
 * (role assignment, wallet / operator provisioning) to it.
 */
@Service
public class OnboardingService {

    private final UserRepository userRepository;
    private final OnboardingStrategyFactory strategyFactory;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public OnboardingService(
            UserRepository userRepository,
            OnboardingStrategyFactory strategyFactory,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.strategyFactory = strategyFactory;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Complete user onboarding after Google OAuth.
     * Updates profile, delegates the role-specific steps to the matching
     * {@link OnboardingStrategy}, and marks onboarding complete.
     * Returns a new JWT token with updated roles.
     */
    @Transactional
    public LoginResponse completeOnboarding(OnboardingCompleteRequest request) {
        String userEmail = SecurityUtils.getCurrentUserEmail();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found: " + userEmail));

        // Update user profile from request
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }

        RoleName roleName = request.role().equalsIgnoreCase("OPERATOR")
                ? RoleName.OPERATOR
                : RoleName.PASSENGER;

        OnboardingStrategy strategy = strategyFactory.getStrategy(roleName);
        strategy.apply(user, request);

        // Mark onboarding as complete
        user.setOnboardingCompleted(true);
        userRepository.save(user);

        // Generate new JWT token with updated roles
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        // Return LoginResponse with new token (onboardingRequired is null/false, so frontend won't redirect)
        return new LoginResponse(token, "Bearer", 3600);
    }
}