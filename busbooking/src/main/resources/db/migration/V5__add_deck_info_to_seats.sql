-- Add deck information to seats table for double-decker bus support
ALTER TABLE seats
ADD COLUMN deck_number INT NULL AFTER seat_number,
ADD COLUMN deck_name VARCHAR(50) NULL AFTER deck_number;

-- Add index for filtering seats by deck
CREATE INDEX idx_seats_bus_deck ON seats(bus_id, deck_number);

-- Add comment
ALTER TABLE seats COMMENT = 'Bus seats with deck information for single/double-decker support';
