package com.yuvan.busbooking.verifynow.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import com.yuvan.busbooking.verifynow.config.MessageCentralConfig;
import com.yuvan.busbooking.verifynow.exception.MessageCentralException;

import lombok.RequiredArgsConstructor;

/**
 * Service for handling Message Central authentication using static auth token
 */
@Service
@RequiredArgsConstructor
public class MessageCentralAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageCentralAuthService.class);
    
    private final MessageCentralConfig config;
    
    /**
     * Get authentication token from configuration
     * Uses the permanent auth token provided by Message Central website
     * 
     * @return Authentication token
     * @throws MessageCentralException if token is not configured
     */
    public String getAuthToken() {
        String token = config.getAuthToken();
        
        if (token == null || token.isEmpty()) {
            logger.error("Auth token not configured. Set MC_AUTH_TOKEN environment variable.");
            throw new MessageCentralException(
                    "Auth token not configured. Please set MC_AUTH_TOKEN environment variable with the token from Message Central website."
            );
        }
        
        // Log token presence (masked for security)
        String maskedToken = token.length() > 20 
            ? token.substring(0, 20) + "..." 
            : "***";
        logger.info("Using configured auth token: {}", maskedToken);
        
        return token;
    }
    
    /**
     * Get authentication headers with token for API requests
     * 
     * @return HttpHeaders with authorization token
     */
    public HttpHeaders getAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        String token = getAuthToken();
        // Try both header name variations to be safe
        headers.set("authToken", token);
        
        logger.debug("Auth headers prepared with token length: {}", token.length());
        
        return headers;
    }
}
