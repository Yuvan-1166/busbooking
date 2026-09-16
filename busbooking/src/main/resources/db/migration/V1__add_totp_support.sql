-- Add TOTP support to users table
ALTER TABLE users 
ADD COLUMN totp_secret VARCHAR(255) NULL COMMENT 'Encrypted TOTP secret',
ADD COLUMN totp_enabled BOOLEAN DEFAULT false NOT NULL,
ADD INDEX idx_totp_enabled (totp_enabled);

-- Track TOTP verification attempts for security and auditing
CREATE TABLE totp_verification_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    verification_type ENUM('LOGIN', 'SETUP') NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempted_at),
    INDEX idx_failed_attempts (user_id, success, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Store backup codes for account recovery
CREATE TABLE backup_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    codes_hash TEXT NOT NULL COMMENT 'JSON array of hashed backup codes',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
