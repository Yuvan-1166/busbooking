-- Add aisle placement info to seats table so seat layouts can be rendered correctly
-- (seats in columns <= aisle_after sit left of the aisle, the rest right of it)
ALTER TABLE seats
ADD COLUMN aisle_after INT NULL AFTER position;

-- Add comment
ALTER TABLE seats COMMENT = 'Bus seats with deck information for single/double-decker support and aisle placement';