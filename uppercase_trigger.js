import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(".env.local") });

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
    CREATE OR REPLACE FUNCTION force_uppercase()
    RETURNS TRIGGER AS $$
    BEGIN
      -- entries table (Agenda)
      IF TG_TABLE_NAME = 'entries' THEN
        IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
        IF NEW.cognome IS NOT NULL THEN NEW.cognome = UPPER(NEW.cognome); END IF;
        IF NEW.note IS NOT NULL THEN NEW.note = UPPER(NEW.note); END IF;
      END IF;
      
      -- gestione_items table (Consulenze)
      IF TG_TABLE_NAME = 'gestione_items' THEN
        IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
        IF NEW.cognome IS NOT NULL THEN NEW.cognome = UPPER(NEW.cognome); END IF;
        IF NEW.note IS NOT NULL THEN NEW.note = UPPER(NEW.note); END IF;
      END IF;

      -- medical_appointments table
      IF TG_TABLE_NAME = 'medical_appointments' THEN
        IF NEW.client_name IS NOT NULL THEN NEW.client_name = UPPER(NEW.client_name); END IF;
        IF NEW.client_surname IS NOT NULL THEN NEW.client_surname = UPPER(NEW.client_surname); END IF;
        IF NEW.notes IS NOT NULL THEN NEW.notes = UPPER(NEW.notes); END IF;
      END IF;

      -- medical_waiting_list table
      IF TG_TABLE_NAME = 'medical_waiting_list' THEN
        IF NEW.name IS NOT NULL THEN NEW.name = UPPER(NEW.name); END IF;
        IF NEW.surname IS NOT NULL THEN NEW.surname = UPPER(NEW.surname); END IF;
      END IF;

      -- pass_items table
      IF TG_TABLE_NAME = 'pass_items' THEN
        IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
        IF NEW.cognome IS NOT NULL THEN NEW.cognome = UPPER(NEW.cognome); END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_entries_uppercase ON entries;
    CREATE TRIGGER trg_entries_uppercase
    BEFORE INSERT OR UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION force_uppercase();

    DROP TRIGGER IF EXISTS trg_gestione_items_uppercase ON gestione_items;
    CREATE TRIGGER trg_gestione_items_uppercase
    BEFORE INSERT OR UPDATE ON gestione_items
    FOR EACH ROW EXECUTE FUNCTION force_uppercase();

    DROP TRIGGER IF EXISTS trg_medical_appointments_uppercase ON medical_appointments;
    CREATE TRIGGER trg_medical_appointments_uppercase
    BEFORE INSERT OR UPDATE ON medical_appointments
    FOR EACH ROW EXECUTE FUNCTION force_uppercase();

    DROP TRIGGER IF EXISTS trg_medical_waiting_list_uppercase ON medical_waiting_list;
    CREATE TRIGGER trg_medical_waiting_list_uppercase
    BEFORE INSERT OR UPDATE ON medical_waiting_list
    FOR EACH ROW EXECUTE FUNCTION force_uppercase();

    DROP TRIGGER IF EXISTS trg_pass_items_uppercase ON pass_items;
    CREATE TRIGGER trg_pass_items_uppercase
    BEFORE INSERT OR UPDATE ON pass_items
    FOR EACH ROW EXECUTE FUNCTION force_uppercase();
  `;
  
  // Actually, Supabase REST JS client doesn't support raw SQL execution easily without RPC.
  // I will check if there is an rpc I can use or if I can just use psql.
}

run();
