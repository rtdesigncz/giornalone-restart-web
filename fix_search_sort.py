import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Update the selections to include entry_time for Agenda and created_at for gestioni
content = content.replace(
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, consulenti(name)");',
    'let agendaQuery = supabase.from("entries").select("id, nome, cognome, telefono, section, entry_date, entry_time, consulenti(name)");'
)
content = content.replace(
    'let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id, gestioni(nome)");',
    'let consulenzeQuery = supabase.from("gestione_items").select("id, nome, cognome, telefono, gestione_id, gestioni(nome, created_at)");'
)

# Replace the sorting and mapping block
old_block = r'const results = \[\];\s*if \(agenda\) \{.*\}\s*if \(waiting\) \{.*\}\s*return NextResponse\.json\(\{ results \}\);'
new_block = r'''const results = [];

        // 1. Process and Sort Agenda: most recent first (by entry_date then entry_time)
        if (agenda) {
            agenda.sort((a, b) => {
                const dateA = a.entry_date || "1970-01-01";
                const dateB = b.entry_date || "1970-01-01";
                if (dateA !== dateB) return dateB.localeCompare(dateA);
                
                const timeA = a.entry_time || "00:00:00";
                const timeB = b.entry_time || "00:00:00";
                return timeB.localeCompare(timeA);
            });

            agenda.forEach(a => {
                const dateStr = a.entry_date ? new Date(a.entry_date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                const consulenteStr = a.consulenti?.name ? ` • ${a.consulenti.name}` : "";
                results.push({ type: "agenda", id: a.id, title: `${a.nome} ${a.cognome}`, subtitle: `${a.section} - ${dateStr}${consulenteStr}`, phone: a.telefono, raw: a });
            });
        }

        // 2. Process and Sort Consulenze: by parent list (gestione) creation date, newest first
        if (consulenze) {
            consulenze.sort((a, b) => {
                const dateA = a.gestioni?.created_at || "1970-01-01T00:00:00Z";
                const dateB = b.gestioni?.created_at || "1970-01-01T00:00:00Z";
                return dateB.localeCompare(dateA);
            });

            consulenze.forEach(c => {
                const listName = c.gestioni?.nome || "Lista Sconosciuta";
                results.push({ type: "consulenze", id: c.id, title: `${c.nome} ${c.cognome}`, subtitle: `Consulenze: ${listName}`, phone: c.telefono, raw: c });
            });
        }

        if (medical) {
            medical.forEach(m => {
                const sessionDate = m.medical_sessions?.date ? new Date(m.medical_sessions.date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
                const dateStr = sessionDate ? ` del ${sessionDate}` : "";
                results.push({ type: "medical", id: m.id, title: `${m.client_name} ${m.client_surname}`, subtitle: `Visita Medica${dateStr}`, phone: m.client_phone, raw: m });
            });
        }

        if (waiting) {
            waiting.forEach(w => results.push({ type: "waiting", id: w.id, title: `${w.name} ${w.surname}`, subtitle: `Lista d'attesa Medico`, phone: w.phone, raw: w }));
        }

        return NextResponse.json({ results });'''
content = re.sub(old_block, new_block, content, flags=re.DOTALL)

with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)

print("Search sorting implemented!")
