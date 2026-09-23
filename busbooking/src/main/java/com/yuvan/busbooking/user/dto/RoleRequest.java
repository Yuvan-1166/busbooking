package com.yuvan.busbooking.user.dto;

import com.yuvan.busbooking.user.entity.RoleName;
import jakarta.validation.constraints.NotNull;

public record RoleRequest(
        @NotNull(message = "Role name is required")
        RoleName name
) {
}