-- Create seat_templates table for pre-built bus seat arrangements
CREATE TABLE IF NOT EXISTS seat_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    deck_type VARCHAR(20) NOT NULL,
    total_seats INT NOT NULL,
    description VARCHAR(500),
    configuration JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_deck_type_active (deck_type, is_active),
    INDEX idx_template_type_active (template_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to explain the table
ALTER TABLE seat_templates COMMENT = 'Pre-built seat arrangement templates for quick bus configuration';
