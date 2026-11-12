-- Migration: Create rinnovi_items table for monthly renewal campaigns with reference expiration
-- Applied non-destructively on 2026-11-12

CREATE TABLE IF NOT EXISTS rinnovi_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  mese_riferimento text NOT NULL, -- Format: YYYY-MM (e.g. '2026-11')
  scadenza_originaria date NOT NULL,
  abbonamento_originario text,
  disciplina text,
  prezzo_originario numeric DEFAULT 0,
  contattato boolean DEFAULT false,
  preso_appuntamento boolean DEFAULT false,
  consulenza_fatta boolean DEFAULT false,
  data_consulenza date,
  entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,
  esito text, -- 'RINNOVO', 'INTEGRAZIONE', 'IN ATTESA', 'NEGATIVO'
  nuovo_abbonamento_name text,
  motivo_negativo text, -- 'INSODDISFATTO', 'NON FREQUENTA', 'TRASFERIMENTO', 'INFORTUNIO', etc.
  data_risposta date,
  note text,
  UNIQUE (client_id, mese_riferimento)
);

CREATE INDEX IF NOT EXISTS idx_rinnovi_items_mese ON rinnovi_items (mese_riferimento);
CREATE INDEX IF NOT EXISTS idx_rinnovi_items_client_id ON rinnovi_items (client_id);
CREATE INDEX IF NOT EXISTS idx_rinnovi_items_entry_id ON rinnovi_items (entry_id);
