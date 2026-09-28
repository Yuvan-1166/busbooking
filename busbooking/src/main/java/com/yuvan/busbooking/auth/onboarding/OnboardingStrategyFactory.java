package com.yuvan.busbooking.auth.onboarding;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.yuvan.busbooking.user.entity.RoleName;

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

    public OnboardingStrategy getStrategy(RoleName role) {
        OnboardingStrategy strategy = strategies.get(role);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported onboarding role: " + role);
        }
        return strategy;
    }
}