package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.operator.entity.Operator;
import com.yuvan.busbooking.operator.entity.OperatorStatus;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import com.yuvan.busbooking.wallet.service.WalletService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for handling user onboarding after Google OAuth login.
 * Assigns role, creates operator profile if needed, and marks onboarding as complete.
 */
@Service
public class OnboardingService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final OperatorRepository operatorRepository;
    private final WalletService walletService;

    public OnboardingService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            OperatorRepository operatorRepository,
            WalletService walletService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.operatorRepository = operatorRepository;
        this.walletService = walletService;
    }

    /**
     * Complete user onboarding after Google OAuth.
     * Updates profile, assigns role, creates operator if needed, and marks onboarding complete.
     */
    @Transactional
    public void completeOnboarding(OnboardingCompleteRequest request) {
        String userEmail = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        System.out.println("=== Onboarding Flow Started ===");
        System.out.println("User: " + userEmail);
        System.out.println("Role: " + request.role());

        // Update user profile from request
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }

        // Assign the selected role
        RoleName roleName = request.role().equalsIgnoreCase("OPERATOR") ? RoleName.OPERATOR : RoleName.PASSENGER;
        
        // Remove temporary PASSENGER role if operator is selected
        if (roleName.equals(RoleName.OPERATOR)) {
            userRoleRepository.findByUserIdWithRoles(user.getId()).stream()
                    .filter(ur -> ur.getRole().getName().equals(RoleName.PASSENGER))
                    .forEach(userRoleRepository::delete);
            System.out.println("Removed temporary PASSENGER role");
        }

        // Assign final role
        var existingRole = userRoleRepository.findByUserIdWithRoles(user.getId()).stream()
                .filter(ur -> ur.getRole().getName().equals(roleName))
                .findFirst();

        if (existingRole.isEmpty()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException(roleName + " role not found"));
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
            System.out.println("Assigned " + roleName + " role");
        }

        // Create wallet if not exists (passenger needs it)
        if (roleName.equals(RoleName.PASSENGER)) {
            try {
                walletService.createWallet(user);
                System.out.println("Wallet created for passenger");
            } catch (Exception e) {
                System.out.println("Wallet already exists or creation failed: " + e.getMessage());
            }
        }

        // Create operator profile if operator role selected
        if (roleName.equals(RoleName.OPERATOR)) {
            String operatorName = request.operatorName() != null ? request.operatorName() : user.getFirstName();
            String registrationNumber = request.registrationNumber() != null ? request.registrationNumber() 
                    : ("AUTO_" + user.getId() + "_" + System.currentTimeMillis());

            Operator operator = new Operator();
            operator.setUser(user);
            operator.setName(operatorName);
            operator.setRegistrationNumber(registrationNumber);
            operator.setContactPhone(request.contactPhone());
            operator.setStatus(OperatorStatus.ACTIVE);
            operatorRepository.save(operator);
            System.out.println("Operator profile created: " + operator.getId());
        }

        // Mark onboarding as complete
        user.setOnboardingCompleted(true);
        userRepository.save(user);

        System.out.println("=== Onboarding Complete ===");
    }
}
