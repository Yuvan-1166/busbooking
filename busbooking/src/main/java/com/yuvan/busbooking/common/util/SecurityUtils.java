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

    public static boolean hasRole(String roleName) {

        Authentication authentication = SecurityContextHolder
                                        .getContext()
                                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return false;
        }

        String prefixed = roleName;

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals(prefixed)
                );
    }
}