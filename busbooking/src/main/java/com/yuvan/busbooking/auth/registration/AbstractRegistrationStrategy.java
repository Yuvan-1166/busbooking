package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.service.OtpService;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.service.UserService;

/**
 * Base class for {@link RegistrationStrategy} implementations exposing the
 * steps that every account-type registration shares: creating the user in a
 * PENDING_VERIFICATION state and dispatching the verification OTP.
 */
public abstract class AbstractRegistrationStrategy implements RegistrationStrategy {

    protected final UserService userService;
    protected final OtpService otpService;

    protected AbstractRegistrationStrategy(UserService userService, OtpService otpService) {
        this.userService = userService;
        this.otpService = otpService;
    }

    /**
     * Creates the user with a PENDING_VERIFICATION status so they cannot log in
     * until their email has been verified.
     */
    protected User createPendingUser(RegisterRequest request) {
        return userService.createUser(new UserRequest(
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                UserStatus.PENDING_VERIFICATION
        ));
    }

    /**
     * Dispatches the email verification OTP that completes registration.
     */
    protected void sendVerificationOtp(User user) {
        otpService.generateAndSend(user.getEmail(), OtpPurpose.REGISTRATION);
    }
}