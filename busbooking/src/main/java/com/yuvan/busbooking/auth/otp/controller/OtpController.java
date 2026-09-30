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


@RestController
@RequestMapping("/auth/verify")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;


    @PostMapping("/send")
    public OtpVerifyResponse send(
            @Valid @RequestBody SendOtpRequest request
    ) {
        return otpService.send(request);
    }

 
    @PostMapping("/confirm")
    public OtpVerifyResponse confirm(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        return otpService.confirm(request);
    }
}
