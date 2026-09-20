package com.yuvan.busbooking.auth.onboarding;

import com.yuvan.busbooking.auth.dto.OnboardingCompleteRequest;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import com.yuvan.busbooking.wallet.service.WalletService;

import org.springframework.stereotype.Service;

/**
 * Onboarding strategy for passenger users: assigns the PASSENGER role and
 * provisions a wallet.
 */
@Service
public class PassengerOnboardingStrategy extends AbstractOnboardingStrategy {

    private final WalletService walletService;

    public PassengerOnboardingStrategy(
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            WalletService walletService
    ) {
        super(roleRepository, userRoleRepository);
        this.walletService = walletService;
    }

    @Override
    public RoleName getRole() {
        return RoleName.PASSENGER;
    }

    @Override
    public void apply(User user, OnboardingCompleteRequest request) {
        ensureRole(user, RoleName.PASSENGER);

        try {
            walletService.createWallet(user);
        } catch (Exception e) {
            // Wallet already exists or creation failed — passenger onboarding
            // should not fail because of a duplicate wallet.
        }
    }
}