-- Add columns for Referral Journey to pass_items table

ALTER TABLE pass_items
ADD COLUMN IF NOT EXISTS data_app_1 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS esito_app_1 TEXT,
ADD COLUMN IF NOT EXISTS data_app_2 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS esito_app_2 TEXT,
ADD COLUMN IF NOT EXISTS data_app_3 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS esito_app_3 TEXT,
ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generated_lead_id UUID;

-- Add comment to explain columns
COMMENT ON COLUMN pass_items.data_app_1 IS 'Date of the first referral appointment';
COMMENT ON COLUMN pass_items.esito_app_1 IS 'Outcome of the first appointment (e.g., pending, show, no_show)';
COMMENT ON COLUMN pass_items.is_lead IS 'True if the pass has been activated and referral entered the funnel';
