-- Migration: Add fields to clients and link entries to clients for Wellness in Cloud sync
-- Applied non-destructively on 2026-11-12

ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_nascita date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pacchetto_originale text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tipo_abbonamento_id uuid REFERENCES tipi_abbonamento(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS disciplina text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_inizio date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_scadenza date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stato text DEFAULT 'ATTIVO';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS prezzo numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS accessi_effettuati integer DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ultimo_accesso date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS indirizzo text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS civico text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cap text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS citta text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS provincia text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now();

-- Drop unique phone constraint to allow family members / shared phones
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_telefono_key;

ALTER TABLE entries ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_nome_cognome ON clients (cognome, nome);
CREATE INDEX IF NOT EXISTS idx_clients_telefono ON clients (telefono);
CREATE INDEX IF NOT EXISTS idx_clients_stato ON clients (stato);
CREATE INDEX IF NOT EXISTS idx_clients_data_scadenza ON clients (data_scadenza);
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries (client_id);
