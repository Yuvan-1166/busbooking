package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.*;
import com.yuvan.busbooking.auth.repository.TotpAlternativeOtpRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.verifynow.dto.OtpSendResponse;
import com.yuvan.busbooking.verifynow.dto.OtpValidateResponse;
import com.yuvan.busbooking.verifynow.service.VerifyNowOtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing TOTP alternative authentication methods
 * Handles SMS, Email, and Backup Code alternatives for login fallback
 * 
 * This service coordinates between different OTP delivery mechanisms:
 * - SMS via VerifyNow API
 * - Email via internal EmailService
 * - Backup codes via existing backup code system
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TotpAlternativeService {
    
    private final TotpAlternativeOtpRepository alternativeOtpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final VerifyNowOtpService verifyNowOtpService;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${totp.alternative.otp.ttl:300}") // 5 minutes default
    private int otpTtlSeconds;
    
    @Value("${totp.alternative.max-attempts:5}")
    private int maxAttempts;
    
    @Value("${totp.alternative.rate-limit-minutes:15}")
    private int rateLimitMinutes;
    
    /**
     * Send alternative OTP to user via specified method
     * 
     * @param user User entity
     * @param method Alternative method (SMS, EMAIL, etc.)
     * @param ipAddress Optional IP address for audit
     * @param userAgent Optional user agent for audit
     * @return Response with masked recipient and session ID
     * @throws IllegalArgumentException if method not supported or user doesn't have required contact info
     */
    public TotpAlternativeOtpResponse sendAlternativeOtp(
            User user,
            TotpAlternativeType method,
            String ipAddress,
            String userAgent
    ) {
        log.info("Sending alternative OTP via {} for user: {}", method, user.getId());
        
        // Check rate limiting
        checkRateLimit(user.getId(), method);
        
        switch (method) {
            case SMS:
                return sendSmsOtp(user, ipAddress, userAgent);
            case EMAIL:
                return sendEmailOtp(user, ipAddress, userAgent);
            case BACKUP_CODE:
                throw new IllegalArgumentException("Backup codes are not sent, only verified");
            default:
                throw new IllegalArgumentException("Unsupported alternative method: " + method);
        }
    }
    
    /**
     * Send OTP via SMS using VerifyNow service
     */
    private TotpAlternativeOtpResponse sendSmsOtp(User user, String ipAddress, String userAgent) {
        // Validate that user has a verified mobile number
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new IllegalArgumentException("User does not have a verified mobile number");
        }
        
        String mobileNumber = user.getPhone();
        
        log.info("Sending SMS OTP to user {} with mobile: ****{}", 
                user.getId(), mobileNumber.substring(Math.max(0, mobileNumber.length() - 4)));
        
        try {
            // Call VerifyNow service to send OTP
            OtpSendResponse verifynowResponse = verifyNowOtpService.sendOtp(mobileNumber);
            
            if (verifynowResponse == null || verifynowResponse.getData() == null) {
                log.error("VerifyNow returned empty response for user {}", user.getId());
                throw new RuntimeException("Failed to send SMS OTP");
            }
            
            String verificationId = verifynowResponse.getData().getVerificationId();
            
            // Generate OTP hash for internal tracking
            String otpHash = generateOtpHash();
            
            // Create and save OTP record
            TotpAlternativeOtp otp = TotpAlternativeOtp.builder()
                    .user(user)
                    .method(TotpAlternativeType.SMS)
                    .verificationId(verificationId)
                    .recipient(mobileNumber)
                    .otpHash(otpHash)
                    .status(OtpStatus.ACTIVE)
                    .attemptCount(0)
                    .expiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            
            TotpAlternativeOtp savedOtp = alternativeOtpRepository.save(otp);
            
            log.info("SMS OTP sent successfully. Session ID: {}", savedOtp.getId());
            
            return TotpAlternativeOtpResponse.builder()
                    .message("OTP sent to your registered mobile number")
                    .method(TotpAlternativeType.SMS)
                    .sessionId(savedOtp.getId().toString())
                    .maskedRecipient(maskMobileNumber(mobileNumber))
                    .expiresIn(otpTtlSeconds)
                    .externalVerificationId(verificationId)
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to send SMS OTP for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS OTP: " + e.getMessage());
        }
    }
    
    /**
     * Send OTP via Email using internal EmailService
     */
    private TotpAlternativeOtpResponse sendEmailOtp(User user, String ipAddress, String userAgent) {
        String email = user.getEmail();
        
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User does not have an email address");
        }
        
        log.info("Sending Email OTP to user {} with email: {}", user.getId(), maskEmail(email));
        
        try {
            // Generate OTP code
            String otp = generateOtpCode();
            String otpHash = passwordEncoder.encode(otp);
            
            // Create and save OTP record (without external verification ID)
            TotpAlternativeOtp otpRecord = TotpAlternativeOtp.builder()
                    .user(user)
                    .method(TotpAlternativeType.EMAIL)
                    .recipient(email)
                    .otpHash(otpHash)
                    .status(OtpStatus.ACTIVE)
                    .attemptCount(0)
                    .expiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            
            TotpAlternativeOtp savedOtp = alternativeOtpRepository.save(otpRecord);
            
            // Send email with OTP
            sendEmailWithOtp(email, otp, user.getFirstName());
            
            log.info("Email OTP sent successfully. Session ID: {}", savedOtp.getId());
            
            return TotpAlternativeOtpResponse.builder()
                    .message("OTP sent to your email")
                    .method(TotpAlternativeType.EMAIL)
                    .sessionId(savedOtp.getId().toString())
                    .maskedRecipient(maskEmail(email))
                    .expiresIn(otpTtlSeconds)
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to send email OTP for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to send email OTP: " + e.getMessage());
        }
    }
    
    /**
     * Verify alternative OTP code
     * 
     * @param user User entity
     * @param sessionId OTP session ID from send response
     * @param code OTP code entered by user
     * @param ipAddress Optional IP address for audit
     * @param userAgent Optional user agent for audit
     * @return true if verification successful, false otherwise
     */
    public boolean verifyAlternativeOtp(
            User user,
            Long sessionId,
            String code,
            String ipAddress,
            String userAgent
    ) {
        log.info("Verifying alternative OTP for user {} with session: {}", user.getId(), sessionId);
        
        TotpAlternativeOtp otp = alternativeOtpRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("OTP session not found"));
        
        // Verify OTP belongs to this user
        if (!otp.getUser().getId().equals(user.getId())) {
            log.warn("OTP session {} does not belong to user {}", sessionId, user.getId());
            throw new IllegalArgumentException("Invalid OTP session");
        }
        
        // Check if OTP is expired
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            log.warn("OTP session {} has expired", sessionId);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            throw new IllegalArgumentException("OTP has expired");
        }
        
        // Check if already verified
        if (otp.getStatus() == OtpStatus.VERIFIED) {
            log.warn("OTP session {} already verified", sessionId);
            throw new IllegalArgumentException("OTP already used");
        }
        
        // Check attempt limit
        if (otp.getAttemptCount() >= maxAttempts) {
            log.warn("Max attempts exceeded for OTP session {}", sessionId);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            throw new IllegalArgumentException("Too many verification attempts");
        }
        
        // Verify based on method
        boolean isValid = false;
        try {
            switch (otp.getMethod()) {
                case SMS:
                    isValid = verifySmsOtp(otp, code);
                    break;
                case EMAIL:
                    isValid = verifyEmailOtp(otp, code);
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported OTP method");
            }
        } catch (Exception e) {
            log.error("Error during OTP verification: {}", e.getMessage(), e);
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            return false;
        }
        
        if (isValid) {
            log.info("Alternative OTP verified successfully for user {}", user.getId());
            otp.setStatus(OtpStatus.VERIFIED);
            otp.setVerifiedAt(LocalDateTime.now());
            alternativeOtpRepository.save(otp);
            return true;
        } else {
            log.warn("Alternative OTP verification failed for user {}", user.getId());
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otp.setStatus(OtpStatus.EXPIRED);
            alternativeOtpRepository.save(otp);
            return false;
        }
    }
    
    /**
     * Verify SMS OTP using VerifyNow API
     */
    private boolean verifySmsOtp(TotpAlternativeOtp otp, String code) {
        if (otp.getVerificationId() == null) {
            log.error("SMS OTP missing verification ID");
            return false;
        }
        
        try {
            OtpValidateResponse response = verifyNowOtpService.validateOtp(otp.getVerificationId(), code);
            
            if (response == null || response.getData() == null) {
                log.error("VerifyNow returned empty response for verification: {}", otp.getVerificationId());
                return false;
            }
            
            boolean isValid = "VERIFICATION_COMPLETED".equalsIgnoreCase(
                    response.getData().getVerificationStatus()
            );
            
            log.info("SMS OTP verification result: {}", isValid);
            return isValid;
            
        } catch (Exception e) {
            log.error("Error verifying SMS OTP: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Verify Email OTP (compare with hash)
     */
    private boolean verifyEmailOtp(TotpAlternativeOtp otp, String code) {
        return passwordEncoder.matches(code, otp.getOtpHash());
    }
    
    /**
     * Check if user is rate limited for this method
     */
    private void checkRateLimit(Long userId, TotpAlternativeType method) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(rateLimitMinutes);
        List<TotpAlternativeOtp> recentAttempts = alternativeOtpRepository.findRecentOtpAttempts(
                userId, method, since
        );
        
        if (recentAttempts.size() >= maxAttempts) {
            log.warn("User {} rate limited for method {}", userId, method);
            throw new IllegalArgumentException(
                    "Too many OTP requests. Please wait " + rateLimitMinutes + " minutes before trying again."
            );
        }
    }
    
    /**
     * Generate random 6-digit OTP code
     */
    private String generateOtpCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000); // 6 digits
        return String.valueOf(code);
    }
    
    /**
     * Generate OTP hash for storage (security measure)
     */
    private String generateOtpHash() {
        return passwordEncoder.encode(generateOtpCode());
    }
    
    /**
     * Mask mobile number for logging/display
     */
    private String maskMobileNumber(String mobileNumber) {
        if (mobileNumber == null || mobileNumber.length() < 4) {
            return "****";
        }
        return "****" + mobileNumber.substring(Math.max(0, mobileNumber.length() - 4));
    }
    
    /**
     * Mask email for logging/display
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "****";
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 1) {
            return "****@" + email.substring(atIndex + 1);
        }
        String localPart = email.substring(0, 1) + "***";
        return localPart + "@" + email.substring(atIndex + 1);
    }
    
    /**
     * Send email with OTP code
     * Delegates to EmailService
     */
    private void sendEmailWithOtp(String email, String otp, String userName) {
        try {
            String subject = "BusBooking - Your Login Verification Code";
            String message = String.format(
                    "Hello %s,\n\n" +
                    "Your login verification code is: %s\n\n" +
                    "This code will expire in %d minutes.\n\n" +
                    "If you didn't request this code, please ignore this email.\n\n" +
                    "Regards,\nBusBooking Team",
                    userName != null ? userName : "User",
                    otp,
                    otpTtlSeconds / 60
            );
            
            emailService.sendOtp(email, otp, 5);
        } catch (Exception e) {
            log.error("Failed to send email with OTP: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
