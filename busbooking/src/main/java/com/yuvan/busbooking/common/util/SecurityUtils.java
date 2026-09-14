package com.yuvan.busbooking.common.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static String getCurrentUserEmail() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "No authenticated user"
            );
        }

        return authentication.getName();
    }

    /**
     * Returns true if the current authenticated user has the given role.
     * Spring prefixes role names with {@code ROLE_}, so pass e.g. {@code "OPERATOR"}.
     */
    public static boolean hasRole(String roleName) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return false;
        }

        String prefixed = "ROLE_" + roleName;

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals(prefixed)
                );
    }
}