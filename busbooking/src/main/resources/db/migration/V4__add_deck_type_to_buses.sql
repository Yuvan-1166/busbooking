-- Add deck_type column to buses table for double-decker support
ALTER TABLE buses
ADD COLUMN deck_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE' AFTER bus_type;

-- Add index for filtering by deck type
CREATE INDEX idx_buses_deck_type ON buses(deck_type);

-- Add comment
ALTER TABLE buses COMMENT = 'Bus information including deck type for single/double-decker support';
