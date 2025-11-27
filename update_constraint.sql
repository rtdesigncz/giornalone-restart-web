-- Rimuove il vecchio vincolo
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_section_check;

-- Aggiunge il nuovo vincolo includendo "MISS CON APPUNTAMENTO"
-- Nota: Manteniamo i vecchi nomi per le altre sezioni per compatibilità con i dati esistenti
ALTER TABLE entries ADD CONSTRAINT entries_section_check CHECK (section IN (
  'TOUR SPONTANEI',
  'APPUNTAMENTI (Pianificazione)',
  'APPUNTAMENTI VERIFICHE DEL BISOGNO',
  'APPUNTAMENTI RINNOVI E INTEGRAZIONI',
  'APPUNTAMENTI TELEFONICI',
  'MISS CON APPUNTAMENTO'
));
