package com.yuvan.busbooking.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.yuvan.busbooking.user.entity.User;

import java.time.LocalDateTime;

/**
 * Entity for tracking TOTP alternative OTP attempts
 * Stores OTP data for SMS, Email, and other alternative methods
 * Used for rate limiting and audit trails
 */
@Entity
@Table(name = "totp_alternative_otp", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_verification_id", columnList = "verification_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TotpAlternativeOtp {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TotpAlternativeType method;
    
    /**
     * Unique verification ID from external service (VerifyNow for SMS, etc.)
     * Null for email-based OTPs generated internally
     */
    @Column(name = "verification_id")
    private String verificationId;
    
    /**
     * Recipient identifier (phone number for SMS, email address for EMAIL)
     */
    @Column(nullable = false)
    private String recipient;
    
    /**
     * Hash of the generated OTP code (for security)
     * Not stored in plaintext
     */
    @Column(nullable = false)
    private String otpHash;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OtpStatus status; // PENDING, VERIFIED, EXPIRED, FAILED
    
    @Column(nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column
    private LocalDateTime verifiedAt;
    
    @Column
    private String ipAddress;
    
    @Column
    private String userAgent;
}
