-- Database Migration: Create TOTP Alternative OTP Tracking Table
-- Purpose: Store OTP sessions for SMS, Email, and other alternative methods
-- Created: 2025-09-17

CREATE TABLE IF NOT EXISTS totp_alternative_otp (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Key to user
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_totp_alt_otp_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    
    -- OTP method type: SMS, EMAIL, BACKUP_CODE
    method VARCHAR(50) NOT NULL,
    
    -- External verification ID (from VerifyNow for SMS)
    verification_id VARCHAR(255),
    
    -- Recipient identifier (phone or email)
    recipient VARCHAR(255) NOT NULL,
    
    -- Hashed OTP code (BCrypt)
    otp_hash VARCHAR(255) NOT NULL,
    
    -- OTP status: PENDING, VERIFIED, EXPIRED, FAILED
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    
    -- Attempt tracking
    attempt_count INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    
    -- Audit fields
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_verification_id (verification_id),
    INDEX idx_created_at (created_at),
    INDEX idx_method_user (method, user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create an index for finding recent OTP attempts (for rate limiting)
CREATE INDEX idx_user_method_created ON totp_alternative_otp(user_id, method, created_at);

-- Create an index for finding failed attempts
CREATE INDEX idx_user_status_created ON totp_alternative_otp(user_id, status, created_at);
