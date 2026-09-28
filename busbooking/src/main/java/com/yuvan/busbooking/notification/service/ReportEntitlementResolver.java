package com.yuvan.busbooking.notification.service;

import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Decides which report a user may see, and which one to build when the one they
 * asked for is not available to them.
 *
 * <p>Shared by the subscription flow and the on-demand PDF export so both apply
 * exactly the same rules — a download must never expose a wider slice of data
 * than the matching email would.</p>
 */
@Component
@Transactional(readOnly = true)
public class ReportEntitlementResolver {

    private final OperatorRepository operatorRepository;
    private final UserRoleRepository userRoleRepository;

    public ReportEntitlementResolver(
            OperatorRepository operatorRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.operatorRepository = operatorRepository;
        this.userRoleRepository = userRoleRepository;
    }

    /**
     * Resolves the report that should actually be produced for this user. Admins
     * without a linked operator profile cannot receive the operator report, so
     * they get the platform report instead.
     */
    public ReportType effectiveReportType(User user, ReportType requested) {
        if (requested != ReportType.OPERATOR_PERFORMANCE) {
            return requested;
        }
        if (hasOperatorProfile(user)) {
            return ReportType.OPERATOR_PERFORMANCE;
        }
        return roles(user).contains(RoleName.ADMIN)
                ? ReportType.PLATFORM_SUMMARY
                : ReportType.OPERATOR_PERFORMANCE;
    }

    public void requireEntitled(User user, ReportType reportType) {
        Set<RoleName> roles = roles(user);

        switch (reportType) {
            case OPERATOR_PERFORMANCE -> {
                if (!roles.contains(RoleName.OPERATOR) && !roles.contains(RoleName.ADMIN)) {
                    throw new IllegalArgumentException(
                            "OPERATOR_PERFORMANCE reports require the OPERATOR role");
                }
                if (roles.contains(RoleName.OPERATOR) && !roles.contains(RoleName.ADMIN)
                        && !hasOperatorProfile(user)) {
                    throw new IllegalArgumentException(
                            "No operator profile is linked to this account");
                }
            }
            case PLATFORM_SUMMARY -> {
                if (!roles.contains(RoleName.ADMIN)) {
                    throw new IllegalArgumentException(
                            "PLATFORM_SUMMARY reports require the ADMIN role");
                }
            }
        }
    }

    private boolean hasOperatorProfile(User user) {
        return operatorRepository.findByUserId(user.getId()).isPresent();
    }

    private Set<RoleName> roles(User user) {
        return userRoleRepository.findByUserIdWithRoles(user.getId())
                .stream()
                .map(UserRole::getRole)
                .map(role -> role.getName())
                .collect(Collectors.toSet());
    }
}
