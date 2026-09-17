package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending OTP via Message Central VerifyNow
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpSendRequest {
    
    @NotBlank(message = "Country code is required")
    @Pattern(regexp = "^[0-9]{1,3}$", message = "Invalid country code")
    @JsonProperty("countryCode")
    private String countryCode;
    
    @NotBlank(message = "Customer ID is required")
    @JsonProperty("customerId")
    private String customerId;
    
    @NotBlank(message = "Flow type is required")
    @JsonProperty("flowType")
    @lombok.Builder.Default
    private String flowType = "SMS"; // Default to SMS
    
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    @JsonProperty("mobileNumber")
    private String mobileNumber;
}
