
CREATE TABLE IF NOT EXISTS pass_gestioni (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    descrizione text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pass_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    gestione_id uuid NOT NULL REFERENCES pass_gestioni(id) ON DELETE CASCADE,
    
    cliente_nome text,
    cliente_cognome text,
    data_consegna date,
    
    referral_nome text,
    referral_cognome text,
    referral_telefono text,
    
    data_attivazione date,
    iscritto boolean DEFAULT false,
    tipo_abbonamento text,
    
    note text,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
