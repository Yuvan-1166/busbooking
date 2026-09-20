package com.yuvan.busbooking.auth.registration;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves a {@link RegistrationStrategy} from its
 * {@link RegistrationType}.
 *
 * <p>All {@link RegistrationStrategy} beans are injected and indexed by type.
 * Strategies are auto-registered — adding a new bean automatically makes it
 * resolvable here.</p>
 */
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

    /**
     * Resolves the registration strategy for the given account type.
     *
     * @param type the desired account type.
     * @return the matching {@link RegistrationStrategy}.
     * @throws IllegalArgumentException if the type has no registered strategy.
     */
    public RegistrationStrategy getStrategy(RegistrationType type) {
        RegistrationStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported registration type: " + type);
        }
        return strategy;
    }
}