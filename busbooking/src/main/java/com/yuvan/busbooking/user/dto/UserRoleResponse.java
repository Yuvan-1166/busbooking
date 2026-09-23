package com.yuvan.busbooking.user.dto;

import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.UserRole;

public record UserRoleResponse(
        Long id,
        Long userId,
        String userEmail,
        Long roleId,
        RoleName roleName
) {
    public static UserRoleResponse fromEntity(UserRole userRole) {
        return new UserRoleResponse(
                userRole.getId(),
                userRole.getUser().getId(),
                userRole.getUser().getEmail(),
                userRole.getRole().getId(),
                userRole.getRole().getName()
        );
    }
}