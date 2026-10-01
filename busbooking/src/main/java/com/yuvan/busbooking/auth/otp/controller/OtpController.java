package com.yuvan.busbooking.auth.otp.controller;

import com.yuvan.busbooking.auth.otp.dto.EmailLinkTokenResponse;
import com.yuvan.busbooking.auth.otp.dto.OtpVerifyResponse;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.service.OtpService;
import com.yuvan.busbooking.auth.service.EmailVerificationTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/auth/verify")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final EmailVerificationTokenService tokenService;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @PostMapping("/send")
    public OtpVerifyResponse send(@Valid @RequestBody SendOtpRequest request) {
        return otpService.send(request);
    }

    @PostMapping("/confirm")
    public OtpVerifyResponse confirm(@Valid @RequestBody VerifyOtpRequest request) {
        return otpService.confirm(request);
    }

    @GetMapping("/email")
    public EmailLinkTokenResponse resolveEmailToken(@RequestParam String token) {
        if (!tokenService.isValid(token)) {
            throw new IllegalArgumentException(
                    "This verification link is invalid or has expired. Please request a new one.");
        }
        String email = tokenService.extractEmail(token);
        return new EmailLinkTokenResponse(email, otpExpiryMinutes);
    }
}
