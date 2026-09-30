package com.yuvan.busbooking.auth.registration;

import com.yuvan.busbooking.auth.dto.RegisterRequest;
import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.service.OtpService;
import com.yuvan.busbooking.user.dto.UserRequest;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.entity.UserStatus;
import com.yuvan.busbooking.user.service.UserService;

public abstract class AbstractRegistrationStrategy implements RegistrationStrategy {

    protected final UserService userService;
    protected final OtpService otpService;

    protected AbstractRegistrationStrategy(UserService userService, OtpService otpService) {
        this.userService = userService;
        this.otpService = otpService;
    }

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

    protected void sendVerificationOtp(User user) {
        otpService.send(
                SendOtpRequest.forEmail(user.getEmail(), OtpPurpose.REGISTRATION));
    }
}