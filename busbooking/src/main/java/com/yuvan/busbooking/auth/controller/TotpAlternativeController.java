package com.yuvan.busbooking.auth.controller;

import com.yuvan.busbooking.auth.dto.LoginResponse;
import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpRequest;
import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.dto.TotpAlternativeVerifyRequest;
import com.yuvan.busbooking.auth.service.CustomUserDetailsService;
import com.yuvan.busbooking.auth.service.JwtService;
import com.yuvan.busbooking.auth.service.TotpAlternativeService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for TOTP alternative authentication methods
 * Handles SMS, Email, and other alternative OTP flows during login
 * 
 * These endpoints are used when the user cannot access their authenticator app
 * and need to fall back to SMS, Email, or backup codes
 */
@RestController
@RequestMapping("/api/v1/auth/totp-alternative")
@RequiredArgsConstructor
@Slf4j
public class TotpAlternativeController {
    
    private final TotpAlternativeService alternativeOtpService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CustomUserDetailsService customUserDetailsService;
    
    /**
     * Send alternative OTP to user
     * 
     * This is called during TOTP login when user chooses an alternative method
     * (SMS, Email, etc.)
     * 
     * POST /api/v1/auth/totp-alternative/send
     * 
     * @param request Contains method (SMS/EMAIL) and temp token
     * @param httpRequest For extracting IP and user agent
     * @return OTP response with masked recipient and session ID
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendAlternativeOtp(
            @Valid @RequestBody TotpAlternativeOtpRequest request,
            HttpServletRequest httpRequest
    ) {
        log.info("Received request to send {} OTP", request.method());
        
        try {
            // Extract user from temporary token
            User user = extractUserFromTempToken(request.tempToken());
            
            if (user == null) {
                log.warn("Failed to extract user from temporary token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid or expired session"));
            }
            
            if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
                log.warn("User {} attempted alternative OTP without 2FA enabled", user.getId());
                throw new IllegalArgumentException("2FA is not enabled for this user");
            }
            
            // Extract IP and user agent for audit
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            // Send alternative OTP
            TotpAlternativeOtpResponse response = alternativeOtpService.sendAlternativeOtp(
                    user,
                    request.method(),
                    ipAddress,
                    userAgent
            );
            
            log.info("Alternative OTP sent successfully for user: {}", user.getId());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error sending alternative OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to send OTP. Please try again later."));
        }
    }
    
    /**
     * Verify alternative OTP code and authenticate user
     * 
     * POST /api/v1/auth/totp-alternative/verify
     * 
     * @param request Contains temp token, session ID, and OTP code
     * @param httpRequest For extracting IP and user agent
     * @return Complete LoginResponse with access token on success
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyAlternativeOtp(
            @Valid @RequestBody TotpAlternativeVerifyRequest request,
            HttpServletRequest httpRequest
    ) {
        log.info("Received request to verify alternative OTP with session: {}", request.sessionId());
        
        try {
            // Extract user from temporary token
            User user = extractUserFromTempToken(request.tempToken());
            
            if (user == null) {
                log.warn("Failed to extract user from temporary token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid or expired session"));
            }
            
            // Extract IP and user agent for audit
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            // Parse session ID
            Long sessionId;
            try {
                sessionId = Long.parseLong(request.sessionId());
            } catch (NumberFormatException e) {
                log.warn("Invalid session ID format: {}", request.sessionId());
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid session ID"));
            }
            
            // Verify alternative OTP
            boolean verified = alternativeOtpService.verifyAlternativeOtp(
                    user,
                    sessionId,
                    request.code(),
                    ipAddress,
                    userAgent
            );
            
            if (!verified) {
                log.warn("Alternative OTP verification failed for user: {}", user.getId());
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid or expired OTP code"));
            }
            
            // Generate full JWT token with UserDetails (same as regular TOTP verification)
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());
            String accessToken = jwtService.generateToken(userDetails);
            
            log.info("Alternative OTP verified successfully for user: {}", user.getId());
            
            // Return complete LoginResponse
            return ResponseEntity.ok(new LoginResponse(accessToken, "Bearer", 3600L));
            
        } catch (IllegalArgumentException e) {
            log.warn("Verification error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error verifying alternative OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Verification failed"));
        }
    }
    
    /**
     * Extract user from temporary JWT token
     * Temporary tokens are created during initial login attempt and contain user info
     * 
     * @param tempToken The temporary JWT token
     * @return User if token is valid, null otherwise
     */
    private User extractUserFromTempToken(String tempToken) {
        try {
            // Validate token first
            if (!jwtService.isTokenValid(tempToken)) {
                log.warn("Temporary token is invalid or expired");
                return null;
            }
            
            // Extract email from token
            String email = jwtService.extractUsername(tempToken);
            
            if (email == null || email.isEmpty()) {
                log.warn("Could not extract email from temporary token");
                return null;
            }
            
            // Fetch user from database
            return userRepository.findByEmail(email).orElse(null);
            
        } catch (Exception e) {
            log.warn("Error extracting user from temporary token: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Get client IP address from HTTP request
     * Handles X-Forwarded-For header for proxied requests
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Response DTO for error responses
     */
    public record ErrorResponse(String message) {}
}
