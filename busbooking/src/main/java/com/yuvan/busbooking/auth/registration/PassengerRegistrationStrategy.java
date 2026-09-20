package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.service.OtpService;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import com.yuvan.busbooking.user.service.UserService;
import com.yuvan.busbooking.wallet.service.WalletService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registration strategy for passenger accounts: assigns the PASSENGER role and
 * provisions the default wallet for every new passenger.
 */
@Service
public class PassengerRegistrationStrategy extends AbstractRegistrationStrategy {

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final WalletService walletService;

    public PassengerRegistrationStrategy(
            UserService userService,
            OtpService otpService,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            WalletService walletService
    ) {
        super(userService, otpService);
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.walletService = walletService;
    }

    @Override
    public RegistrationType getType() {
        return RegistrationType.PASSENGER;
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        System.out.println("Before Create");
        User user = createPendingUser(request);
        System.out.println("After Create");

        Role passengerRole = roleRepository
                .findByName(RoleName.PASSENGER)
                .orElseThrow(() ->
                        new IllegalStateException("PASSENGER role not found"));

        System.out.println("Before role");

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(passengerRole);
        userRoleRepository.save(userRole);

        System.out.println("After Role");
        System.out.println("Before Wallet");

        // Create wallet with default ₹10,000 balance for every new passenger
        walletService.createWallet(user);

        System.out.println("After wallet");
        System.out.println("Before OTP");

        sendVerificationOtp(user);

        System.out.println("After OTP");

        return new RegisterResponse(
                user.getId(),
                null,
                user.getEmail(),
                user.getFirstName(),
                null,
                "Registration successful. Check your email for a verification code."
        );
    }
}