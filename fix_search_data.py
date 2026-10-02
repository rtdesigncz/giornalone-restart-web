import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Fix the Agenda query to use consulenti(name)
content = content.replace(
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, consulente");',
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, consulenti(name)");'
)

# Replace the formatting with something very basic, we'll handle UI in CommandPalette
# Just to be safe, I will leave subtitle there but we'll ignore it.
with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)
print("API search fixed!")
