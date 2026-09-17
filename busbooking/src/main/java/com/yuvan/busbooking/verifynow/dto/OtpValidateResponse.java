package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for OTP validation operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpValidateResponse {
    
    @JsonProperty("responseCode")
    private Integer responseCode;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("data")
    private OtpValidateData data;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpValidateData {
        
        @JsonProperty("verificationId")
        private String verificationId;
        
        @JsonProperty("mobileNumber")
        private String mobileNumber;
        
        @JsonProperty("verificationStatus")
        private String verificationStatus;
        
        @JsonProperty("responseCode")
        private String responseCode;
        
        @JsonProperty("errorMessage")
        private String errorMessage;
        
        @JsonProperty("transactionId")
        private String transactionId;
    }
}
