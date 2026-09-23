package com.yuvan.busbooking.user.dto;

import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;

public record RoleResponse(
        Long id,
        RoleName name
) {
    public static RoleResponse fromEntity(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getName()
        );
    }
}