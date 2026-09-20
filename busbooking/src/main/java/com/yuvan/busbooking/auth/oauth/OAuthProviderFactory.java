package com.yuvan.busbooking.auth.oauth;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registry-style factory that resolves an {@link OAuthProvider} from its
 * {@link OAuthProviderType}.
 *
 * <p>All {@link OAuthProvider} beans are injected and indexed by type.
 * Providers are auto-registered — adding a new bean automatically makes it
 * resolvable here.</p>
 */
@Service
public class OAuthProviderFactory {

    private final Map<OAuthProviderType, OAuthProvider> providers;

    public OAuthProviderFactory(List<OAuthProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        OAuthProvider::getType,
                        Function.identity()
                ));
    }

    /**
     * Resolves the provider implementation for the given type.
     *
     * @param type the desired provider.
     * @return the matching {@link OAuthProvider}.
     * @throws IllegalArgumentException if the type has no registered provider.
     */
    public OAuthProvider getProvider(OAuthProviderType type) {
        OAuthProvider provider = providers.get(type);
        if (provider == null) {
            throw new IllegalArgumentException("Unsupported OAuth provider: " + type);
        }
        return provider;
    }
}