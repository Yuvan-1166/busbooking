package com.yuvan.busbooking.auth.otp.controller;

import com.yuvan.busbooking.auth.otp.dto.OtpVerifyResponse;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The only OTP endpoints in the application.
 *
 * <p>Both endpoints are delivery-method agnostic: the request names the
 * channel and the destination, and the channel resolved by
 * {@link com.yuvan.busbooking.auth.otp.channel.OtpChannelFactory} decides how
 * the code is sent and how the destination is handled. Adding a new delivery
 * method therefore requires no new endpoint here.</p>
 */
@RestController
@RequestMapping("/api/v1/auth/verify")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    /**
     * Sends (or resends) a one-time password to the requested destination.
     * Supersedes any code still active for the same destination and purpose.
     *
     * <p>POST /api/v1/auth/verify/send</p>
     */
    @PostMapping("/send")
    public OtpVerifyResponse send(
            @Valid @RequestBody SendOtpRequest request
    ) {
        return otpService.send(request);
    }

    /**
     * Confirms the code the user entered and applies the side effects its
     * purpose defines.
     *
     * <p>POST /api/v1/auth/verify/confirm</p>
     */
    @PostMapping("/confirm")
    public OtpVerifyResponse confirm(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        return otpService.confirm(request);
    }
}
