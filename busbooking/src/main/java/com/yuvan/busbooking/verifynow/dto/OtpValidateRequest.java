package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for validating OTP via Message Central VerifyNow
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpValidateRequest {
    
    @NotBlank(message = "Country code is required")
    @Pattern(regexp = "^[0-9]{1,3}$", message = "Invalid country code")
    @JsonProperty("countryCode")
    private String countryCode;
    
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    @JsonProperty("mobileNumber")
    private String mobileNumber;
    
    @NotBlank(message = "Verification ID is required")
    @JsonProperty("verificationId")
    private String verificationId;
    
    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^[0-9]{4,6}$", message = "OTP must be 4-6 digits")
    @JsonProperty("code")
    private String code;
    
    @NotBlank(message = "Customer ID is required")
    @JsonProperty("customerId")
    private String customerId;
}
