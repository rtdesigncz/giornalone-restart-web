-- Add whatsapp_sent column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false;
