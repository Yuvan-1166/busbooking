package com.yuvan.busbooking.verifynow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.messagecentral")
public class MessageCentralConfig {
    
    private String customerId;
    
    private String authToken;
    
    private VerifyNowConfig verifynow = new VerifyNowConfig();
    
    @Data
    public static class VerifyNowConfig {
        private String baseUrl;
        
        private String countryCode = "91";
    }
}
