
-- Esegui tutto questo blocco nel Supabase SQL Editor

-- 1. Aggiungi la colonna mancante
ALTER TABLE pass_items ADD COLUMN IF NOT EXISTS cliente_telefono text;

-- 2. Forza l'aggiornamento della cache di Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
