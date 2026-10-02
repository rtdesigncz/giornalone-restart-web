import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Instead of a single searchTerm, let's create a dynamic PostgREST query chain
new_logic = """
        const terms = q.trim().split(/\s+/).filter(t => t.length > 0);
        
        let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date");
        let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id");
        let medicalQuery = supabase.from("medical_appointments").select("id, client_name, client_surname, client_phone, session_id");
        let waitingQuery = supabase.from("medical_waiting_list").select("id, name, surname, phone");

        terms.forEach(term => {
            const t = `%${term}%`;
            agendaQuery = agendaQuery.or(`nome.ilike.${t},cognome.ilike.${t},telefono.ilike.${t}`);
            consulenzeQuery = consulenzeQuery.or(`nome.ilike.${t},cognome.ilike.${t},telefono.ilike.${t}`);
            medicalQuery = medicalQuery.or(`client_name.ilike.${t},client_surname.ilike.${t},client_phone.ilike.${t}`);
            waitingQuery = waitingQuery.or(`name.ilike.${t},surname.ilike.${t},phone.ilike.${t}`);
        });

        const { data: agenda } = await agendaQuery.limit(10);
        const { data: consulenze } = await consulenzeQuery.limit(10);
        const { data: medical } = await medicalQuery.limit(5);
        const { data: waiting } = await waitingQuery.limit(5);
"""

# Replace the old logic
old_regex = re.compile(r'const searchTerm = `%\$\{q\}%`;.*?const \{ data: waiting \} = await supabase[^;]+limit\(5\);', re.DOTALL)
content = old_regex.sub(new_logic, content)

with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)

print("Search API updated!")
