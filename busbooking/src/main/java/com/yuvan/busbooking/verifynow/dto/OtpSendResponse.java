package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for OTP send operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpSendResponse {
    
    @JsonProperty("responseCode")
    private Integer responseCode;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("data")
    private OtpSendData data;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpSendData {
        
        @JsonProperty("verificationId")
        private String verificationId;
        
        @JsonProperty("mobileNumber")
        private String mobileNumber;
        
        @JsonProperty("responseCode")
        private String responseCode;
        
        @JsonProperty("errorMessage")
        private String errorMessage;
        
        @JsonProperty("timeout")
        private String timeout;
        
        @JsonProperty("smsCLI")
        private String smsCLI;
        
        @JsonProperty("transactionId")
        private String transactionId;
    }
}
