-- Add 'negativo' column to 'entries' table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS negativo BOOLEAN DEFAULT FALSE;

-- Update 'entries_v' view to include 'negativo'
CREATE OR REPLACE VIEW entries_v AS
SELECT
    e.id,
    e.created_at,
    e.entry_date,
    e.entry_time,
    e.nome,
    e.cognome,
    e.telefono,
    e.email,
    e.section,
    e.consulente_id,
    e.tipo_abbonamento_id,
    e.fonte_id,
    e.note,
    e.venduto,
    e.miss,
    e.presentato,
    e.contattato,
    e.negativo, -- New column
    c.name AS consulente_name,
    t.name AS tipo_abbonamento_name,
    f.name AS fonte_name
FROM entries e
LEFT JOIN consulenti c ON e.consulente_id = c.id
LEFT JOIN tipi_abbonamento t ON e.tipo_abbonamento_id = t.id
LEFT JOIN fonti f ON e.fonte_id = f.id;
