package com.yuvan.busbooking.auth.onboarding;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.yuvan.busbooking.user.entity.RoleName;

/**
 * Registry-style factory that resolves an {@link OnboardingStrategy} from its
 * {@link RoleName}.
 *
 * <p>All {@link OnboardingStrategy} beans are injected and indexed by target
 * role. Strategies are auto-registered — adding a new bean automatically makes
 * it resolvable here.</p>
 */
@Service
public class OnboardingStrategyFactory {

    private final Map<RoleName, OnboardingStrategy> strategies;

    public OnboardingStrategyFactory(List<OnboardingStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        OnboardingStrategy::getRole,
                        Function.identity()
                ));
    }

    /**
     * Resolves the onboarding strategy for the given target role.
     *
     * @param role the desired role.
     * @return the matching {@link OnboardingStrategy}.
     * @throws IllegalArgumentException if the role has no registered strategy.
     */
    public OnboardingStrategy getStrategy(RoleName role) {
        OnboardingStrategy strategy = strategies.get(role);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported onboarding role: " + role);
        }
        return strategy;
    }
}