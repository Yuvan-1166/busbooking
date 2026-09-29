package com.yuvan.busbooking.auth.registration;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RegistrationStrategyFactory {

    private final Map<RegistrationType, RegistrationStrategy> strategies;

    public RegistrationStrategyFactory(List<RegistrationStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        RegistrationStrategy::getType,
                        Function.identity()
                ));
    }


    public RegistrationStrategy getStrategy(RegistrationType type) {
        RegistrationStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported registration type: " + type);
        }
        return strategy;
    }
}