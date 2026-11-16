-- Migration: Add exclusion flags for renewal campaigns
-- clients.escluso_rinnovi: Permanent exclusion from all renewal campaigns (Staff / Special)
-- rinnovi_items.escluso: Single-month campaign exclusion

ALTER TABLE clients ADD COLUMN IF NOT EXISTS escluso_rinnovi BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rinnovi_items ADD COLUMN IF NOT EXISTS escluso BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clients_escluso_rinnovi ON clients (escluso_rinnovi);
CREATE INDEX IF NOT EXISTS idx_rinnovi_items_escluso ON rinnovi_items (escluso);
