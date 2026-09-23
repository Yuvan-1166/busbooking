package com.yuvan.busbooking.user.dto;

import jakarta.validation.constraints.NotNull;

public record UserRoleRequest(
        @NotNull(message = "User id is required")
        Long userId,

        @NotNull(message = "Role id is required")
        Long roleId
) {
}