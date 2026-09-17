package com.yuvan.busbooking.verifynow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * Configuration properties for Message Central VerifyNow API
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.messagecentral")
public class MessageCentralConfig {
    
    /**
     * Customer ID for Message Central account
     */
    private String customerId;
    
    /**
     * Permanent auth token provided by Message Central website
     */
    private String authToken;
    
    /**
     * VerifyNow API specific configuration
     */
    private VerifyNowConfig verifynow = new VerifyNowConfig();
    
    @Data
    public static class VerifyNowConfig {
        /**
         * Base URL for VerifyNow API endpoints
         */
        private String baseUrl;
        
        /**
         * Default country code for phone numbers
         */
        private String countryCode = "91";
    }
}
