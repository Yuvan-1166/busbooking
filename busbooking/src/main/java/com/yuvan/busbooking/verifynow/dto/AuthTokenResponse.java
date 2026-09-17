package com.yuvan.busbooking.verifynow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Message Central authentication
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenResponse {
    
    @JsonProperty("responseCode")
    private Integer responseCode;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("data")
    private AuthData data;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthData {
        
        @JsonProperty("customerId")
        private String customerId;
        
        @JsonProperty("token")
        private String token;
        
        @JsonProperty("country")
        private String country;
        
        @JsonProperty("accountStatus")
        private String accountStatus;
        
        @JsonProperty("expiry")
        private Long expiry;
    }
}
