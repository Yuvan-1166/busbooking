package com.yuvan.busbooking.verifynow.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuvan.busbooking.verifynow.dto.ApiResponse;
import com.yuvan.busbooking.verifynow.dto.OtpSendResponse;
import com.yuvan.busbooking.verifynow.dto.OtpValidateResponse;
import com.yuvan.busbooking.verifynow.service.VerifyNowOtpService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

/**
 * REST Controller for VerifyNow OTP operations
 */
@RestController
@RequestMapping("/api/v1/verifynow")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
public class VerifyNowController {
    
    private static final Logger logger = LoggerFactory.getLogger(VerifyNowController.class);
    
    private final VerifyNowOtpService otpService;
    
    /**
     * Send OTP to mobile number
     * 
     * POST /api/verifynow/send-otp
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<OtpSendResponse>> sendOtp(
            @Valid @RequestBody SendOtpRequestDto request) {
        
        logger.info("Received request to send OTP to mobile: ******{}", 
                request.getMobileNumber().substring(Math.max(0, request.getMobileNumber().length() - 4)));
        
        OtpSendResponse response = otpService.sendOtp(request.getMobileNumber());
        
        return ResponseEntity.ok(
                ApiResponse.success(response, "OTP sent successfully")
        );
    }
    
    /**
     * Validate OTP
     * 
     * POST /api/verifynow/validate-otp
     */
    @PostMapping("/validate-otp")
    public ResponseEntity<ApiResponse<ValidateOtpResultDto>> validateOtp(
            @Valid @RequestBody ValidateOtpRequestDto request) {
        
        logger.info("Received request to validate OTP for verification ID: {}", request.getVerificationId());
        
        OtpValidateResponse response = otpService.validateOtp(
                request.getVerificationId(),
                request.getCode()
        );
        
        // Check if validation was successful
        boolean isValid = response.getData() != null 
                && "VERIFICATION_COMPLETED".equalsIgnoreCase(response.getData().getVerificationStatus());
        
        ValidateOtpResultDto result = new ValidateOtpResultDto(
                isValid,
                response.getMessage(),
                response.getData() != null ? response.getData().getVerificationId() : null
        );
        
        String message = isValid ? "OTP validated successfully" : "OTP validation failed";
        HttpStatus status = isValid ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        
        return ResponseEntity.status(status).body(
                ApiResponse.success(result, message)
        );
    }
    
    /**
     * Request DTO for sending OTP
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendOtpRequestDto {
        
        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
        private String mobileNumber;
    }
    
    /**
     * Request DTO for validating OTP
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidateOtpRequestDto {
        
        @NotBlank(message = "Verification ID is required")
        private String verificationId;
        
        @NotBlank(message = "OTP code is required")
        @Pattern(regexp = "^[0-9]{4,6}$", message = "OTP must be 4-6 digits")
        private String code;
    }
    
    /**
     * Response DTO for OTP validation result
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidateOtpResultDto {
        private boolean valid;
        private String message;
        private String verificationId;
    }
}
