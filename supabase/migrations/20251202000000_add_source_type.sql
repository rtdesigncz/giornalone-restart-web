-- Add source_type column to pass_items table
ALTER TABLE pass_items 
ADD COLUMN source_type TEXT DEFAULT 'pass';

-- Update existing rows to have 'pass' as source_type
UPDATE pass_items SET source_type = 'pass' WHERE source_type IS NULL;
