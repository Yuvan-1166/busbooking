package com.yuvan.busbooking.verifynow.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.yuvan.busbooking.verifynow.config.MessageCentralConfig;
import com.yuvan.busbooking.verifynow.dto.OtpSendResponse;
import com.yuvan.busbooking.verifynow.dto.OtpValidateResponse;
import com.yuvan.busbooking.verifynow.exception.VerifyNowOtpException;

import lombok.RequiredArgsConstructor;

/**
 * Service for VerifyNow OTP operations (send and validate)
 * Uses query parameters as per Message Central API specification
 */
@Service
@RequiredArgsConstructor
public class VerifyNowOtpService {
    
    private static final Logger logger = LoggerFactory.getLogger(VerifyNowOtpService.class);
    
    @Qualifier("messageCentralRestTemplate")
    private final RestTemplate restTemplate;
    
    private final MessageCentralConfig config;
    private final MessageCentralAuthService authService;
    
    /**
     * Send OTP to the specified mobile number
     * Uses query parameters: countryCode, flowType, mobileNumber
     * 
     * @param mobileNumber The mobile number to send OTP to (10 digits)
     * @return OtpSendResponse containing verification ID and status
     * @throws VerifyNowOtpException if OTP send operation fails
     */
    public OtpSendResponse sendOtp(String mobileNumber) {
        logger.info("Sending OTP to mobile number: {}", maskMobileNumber(mobileNumber));
        
        try {
            // Build URL with query parameters
            String url = UriComponentsBuilder.fromUriString(config.getVerifynow().getBaseUrl() + "/send")
                    .queryParam("countryCode", config.getVerifynow().getCountryCode())
                    .queryParam("flowType", "SMS")
                    .queryParam("mobileNumber", mobileNumber)
                    .toUriString();
            
            logger.info("OTP Send URL: {}", url);
            logger.info("Parameters - Country Code: {}, Flow Type: SMS, Mobile: {}", 
                    config.getVerifynow().getCountryCode(), maskMobileNumber(mobileNumber));
            
            // Get auth headers
            HttpHeaders headers = authService.getAuthHeaders();
            logger.info("Auth token present: {}", headers.get("authToken") != null);
            
            // Empty body - Message Central API uses query params only
            HttpEntity<String> entity = new HttpEntity<>("", headers);
            
            // Make API call
            ResponseEntity<OtpSendResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    OtpSendResponse.class
            );
            
            logger.info("Response Status: {}", response.getStatusCode());
            
            // Validate response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                OtpSendResponse otpResponse = response.getBody();
                
                // Check if OTP was sent successfully
                if (otpResponse.getResponseCode() != null && otpResponse.getResponseCode() == 200) {
                    logger.info("OTP sent successfully. Verification ID: {}", 
                            otpResponse.getData() != null ? otpResponse.getData().getVerificationId() : "N/A");
                    return otpResponse;
                } else {
                    // OTP send failed
                    String errorMessage = otpResponse.getMessage() != null 
                            ? otpResponse.getMessage() 
                            : "Failed to send OTP";
                    logger.error("OTP send failed: {}", errorMessage);
                    throw new VerifyNowOtpException(otpResponse.getResponseCode(), errorMessage);
                }
            }
            
            throw new VerifyNowOtpException("Unexpected response from VerifyNow send API");
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            logger.error("HTTP error while sending OTP: {} - {}", e.getStatusCode(), e.getMessage());
            throw new VerifyNowOtpException(
                    e.getStatusCode().value(),
                    "OTP send API error: " + e.getMessage(),
                    e
            );
        } catch (VerifyNowOtpException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while sending OTP", e);
            throw new VerifyNowOtpException(
                    "Failed to send OTP: " + e.getMessage(),
                    e
            );
        }
    }
    
    /**
     * Validate OTP for the given verification ID
     * Uses GET method with query parameters: verificationId, code
     * 
     * @param verificationId The verification ID received from sendOtp
     * @param code The OTP code entered by user (4-6 digits)
     * @return OtpValidateResponse containing validation status
     * @throws VerifyNowOtpException if OTP validation fails
     */
    public OtpValidateResponse validateOtp(String verificationId, String code) {
        logger.info("Validating OTP for verification ID: {}", verificationId);
        
        try {
            // Build URL with query parameters (exact match to working curl command)
            String url = UriComponentsBuilder.fromUriString(config.getVerifynow().getBaseUrl() + "/validateOtp")
                    .queryParam("verificationId", verificationId)
                    .queryParam("code", code)
                    .toUriString();
            
            logger.info("OTP Validate URL: {}", url);
            logger.info("Parameters - Verification ID: {}, Code: {}", verificationId, "****");
            
            // Create fresh headers specifically for this request
            HttpHeaders headers = new HttpHeaders();
            String token = authService.getAuthToken();
            headers.set("authToken", token);
            
            logger.info("Auth token set in validateOtp: {}", token != null && !token.isEmpty());
            logger.info("Auth token value (first 30 chars): {}", token.substring(0, Math.min(30, token.length())));
            
            // Empty body - Message Central API uses query params only
            HttpEntity<String> entity = new HttpEntity<>("", headers);
            
            logger.info("Request method: GET");
            logger.info("Request headers: {}", headers);
            logger.info("Request URL: {}", url);
            
            // Make API call using GET method (not POST!)
            ResponseEntity<OtpValidateResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    OtpValidateResponse.class
            );
            
            logger.info("Response Status: {}", response.getStatusCode());
            
            // Validate response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                OtpValidateResponse validateResponse = response.getBody();
                
                // Check validation result
                if (validateResponse.getResponseCode() != null && validateResponse.getResponseCode() == 200) {
                    boolean isValid = validateResponse.getData() != null 
                            && "VERIFICATION_COMPLETED".equalsIgnoreCase(validateResponse.getData().getVerificationStatus());
                    
                    if (isValid) {
                        logger.info("OTP validated successfully for verification ID: {}", verificationId);
                    } else {
                        logger.warn("OTP validation failed for verification ID: {}", verificationId);
                    }
                    
                    return validateResponse;
                } else {
                    // Validation failed with error
                    String errorMessage = validateResponse.getMessage() != null 
                            ? validateResponse.getMessage() 
                            : "OTP validation failed";
                    logger.error("OTP validation error: {}", errorMessage);
                    throw new VerifyNowOtpException(validateResponse.getResponseCode(), errorMessage);
                }
            }
            
            throw new VerifyNowOtpException("Unexpected response from VerifyNow validate API");
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            logger.error("HTTP error while validating OTP: {} - {}", e.getStatusCode(), e.getMessage());
            logger.error("Response headers: {}", e.getResponseHeaders());
            throw new VerifyNowOtpException(
                    e.getStatusCode().value(),
                    "OTP validation API error: " + e.getMessage(),
                    e
            );
        } catch (VerifyNowOtpException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while validating OTP", e);
            throw new VerifyNowOtpException(
                    "Failed to validate OTP: " + e.getMessage(),
                    e
            );
        }
    }
    
    /**
     * Mask mobile number for logging (show only last 4 digits)
     */
    private String maskMobileNumber(String mobileNumber) {
        if (mobileNumber == null || mobileNumber.length() < 4) {
            return "****";
        }
        return "******" + mobileNumber.substring(mobileNumber.length() - 4);
    }
}
