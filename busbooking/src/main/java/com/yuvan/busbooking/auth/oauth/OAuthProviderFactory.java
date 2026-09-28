package com.yuvan.busbooking.auth.oauth;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    public OAuthProvider getProvider(OAuthProviderType type) {
        OAuthProvider provider = providers.get(type);
        if (provider == null) {
            throw new IllegalArgumentException("Unsupported OAuth provider: " + type);
        }
        return provider;
    }
}