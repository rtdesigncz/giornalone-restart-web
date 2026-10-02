import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Update select statements
content = content.replace(
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date");',
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, consulente");'
)

content = content.replace(
    'let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id");',
    'let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id, gestioni(nome)");'
)

content = content.replace(
    'let medicalQuery = supabase.from("medical_appointments").select("id, client_name, client_surname, client_phone, session_id");',
    'let medicalQuery = supabase.from("medical_appointments").select("id, client_name, client_surname, client_phone, session_id, medical_sessions(date)");'
)

with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)

print("API selections updated!")
