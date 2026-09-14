package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.dto.LoginRequest;
import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.OperatorRegisterRequest;
import com.yuvan.busbooking.auth.dto.OperatorRegisterResponse;
import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.dto.RegisterResponse;
import com.yuvan.busbooking.auth.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.dto.ResetPasswordResponse;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.operator.dto.OperatorRequest;
import com.yuvan.busbooking.operator.dto.OperatorResponse;
import com.yuvan.busbooking.operator.entity.OperatorStatus;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.operator.service.OperatorService;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.entity.Role;
import com.yuvan.busbooking.user.entity.RoleName;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserRole;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.repository.RoleRepository;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.user.repository.UserRoleRepository;
import com.yuvan.busbooking.user.service.UserService;
import com.yuvan.busbooking.wallet.service.WalletService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final OperatorRepository operatorRepository;
    private final OperatorService operatorService;
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final WalletService walletService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            OperatorRepository operatorRepository,
            OperatorService operatorService,
            UserService userService,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            WalletService walletService,
            OtpService otpService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.operatorRepository = operatorRepository;
        this.operatorService = operatorService;
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.walletService = walletService;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create user with PENDING_VERIFICATION — they cannot log in until verified
        UserRequest userRequest = new UserRequest(
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                UserStatus.PENDING_VERIFICATION
        );

        User user = userService.createUser(userRequest);

        Role passengerRole = roleRepository
                .findByName(RoleName.PASSENGER)
                .orElseThrow(() ->
                        new IllegalStateException("PASSENGER role not found"));

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(passengerRole);
        userRoleRepository.save(userRole);

        // Create wallet with default ₹10,000 balance for every new passenger
        walletService.createWallet(user);

        // Send OTP — email is the registration trigger
        otpService.generateAndSend(user.getEmail(), OtpPurpose.REGISTRATION);

        return new RegisterResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                "Registration successful. Check your email for a verification code."
        );
    }

    @Transactional
    public OperatorRegisterResponse registerOperator(
            OperatorRegisterRequest request
    ) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalStateException("Email already registered");
        }

        if (operatorRepository.existsByRegistrationNumber(
                request.registrationNumber())) {
            throw new IllegalStateException(
                    "Operator registration number already exists");
        }

        // Operator also starts PENDING_VERIFICATION
        User user = userService.createUser(
                new UserRequest(
                        request.email(),
                        request.password(),
                        request.firstName(),
                        request.lastName(),
                        request.phone(),
                        UserStatus.PENDING_VERIFICATION
                ));

        OperatorResponse operatorResponse = operatorService.create(
                new OperatorRequest(
                        user.getId(),
                        request.operatorName(),
                        request.registrationNumber(),
                        user.getEmail(),
                        request.contactPhone(),
                        OperatorStatus.ACTIVE
                ));

        // Send OTP
        otpService.generateAndSend(user.getEmail(), OtpPurpose.REGISTRATION);

        return new OperatorRegisterResponse(
                user.getId(),
                operatorResponse.id(),
                user.getEmail(),
                operatorResponse.name(),
                "Operator registration successful. Check your email for a verification code."
        );
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.email(),
                                request.password()
                        )
                );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String token = jwtService.generateToken(userDetails);

        return new LoginResponse(token, "Bearer", 3600);
    }

    /**
     * Initiates a password reset by sending an OTP to the given email.
     * Silently succeeds even if the email is not registered (prevents user enumeration).
     */
    public ResetPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        try {
            otpService.generateAndSendPasswordReset(request.email());
        } catch (Exception ignored) {
            // Don't reveal whether the email exists or not
        }
        return new ResetPasswordResponse(
                "If an account with that email exists, a reset code has been sent.");
    }

    /**
     * Verifies the OTP and updates the user's password in one step.
     */
    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        // Verify OTP — throws on failure
        otpService.verifyForPasswordReset(request.email(), request.otp().trim());

        // Update the password
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found: " + request.email()));

        if(passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException(
                        "New Password Must be different from your Current Password"
                );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new ResetPasswordResponse("Password reset successfully. You can now sign in.");
    }
}