package com.yuvan.busbooking.auth.onboarding;

import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;

public abstract class AbstractOnboardingStrategy implements OnboardingStrategy {

    protected final RoleRepository roleRepository;
    protected final UserRoleRepository userRoleRepository;

    protected AbstractOnboardingStrategy(
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
    }

    protected void removeRole(User user, RoleName roleName) {
        userRoleRepository.findByUserIdWithRoles(user.getId()).stream()
                .filter(ur -> ur.getRole().getName().equals(roleName))
                .forEach(userRoleRepository::delete);
    }

    protected void ensureRole(User user, RoleName roleName) {
        boolean hasRole = userRoleRepository.findByUserIdWithRoles(user.getId()).stream()
                .anyMatch(ur -> ur.getRole().getName().equals(roleName));

        if (!hasRole) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException(roleName + " role not found"));
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }
    }
}