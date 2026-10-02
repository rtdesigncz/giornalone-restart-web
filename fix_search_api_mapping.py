import re

with open("src/app/api/search/route.ts", "r") as f:
    content = f.read()

# Update mapping logic
old_agenda = r'agenda\.forEach\(a => results\.push\(\{ type: "agenda", id: a\.id, title: `\$\{a\.nome\} \$\{a\.cognome\}`, subtitle: `\$\{a\.section\} - \$\{a\.entry_date\}`, phone: a\.telefono, raw: a \}\)\);'
new_agenda = r'''agenda.forEach(a => {
            const dateStr = a.entry_date ? new Date(a.entry_date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
            const consulenteStr = a.consulente ? ` • ${a.consulente}` : "";
            results.push({ type: "agenda", id: a.id, title: `${a.nome} ${a.cognome}`, subtitle: `${a.section} - ${dateStr}${consulenteStr}`, phone: a.telefono, raw: a });
        });'''
content = re.sub(old_agenda, new_agenda, content)

old_cons = r'consulenze\.forEach\(c => results\.push\(\{ type: "consulenze", id: c\.id, title: `\$\{c\.nome\} \$\{c\.cognome\}`, subtitle: `Consulenza`, phone: c\.telefono, raw: c \}\)\);'
new_cons = r'''consulenze.forEach(c => {
            const listName = c.gestioni?.nome || "Lista Sconosciuta";
            results.push({ type: "consulenze", id: c.id, title: `${c.nome} ${c.cognome}`, subtitle: `Consulenze: ${listName}`, phone: c.telefono, raw: c });
        });'''
content = re.sub(old_cons, new_cons, content)

old_med = r'medical\.forEach\(m => results\.push\(\{ type: "medical", id: m\.id, title: `\$\{m\.client_name\} \$\{m\.client_surname\}`, subtitle: `Visita Medica`, phone: m\.client_phone, raw: m \}\)\);'
new_med = r'''medical.forEach(m => {
            const sessionDate = m.medical_sessions?.date ? new Date(m.medical_sessions.date).toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
            const dateStr = sessionDate ? ` del ${sessionDate}` : "";
            results.push({ type: "medical", id: m.id, title: `${m.client_name} ${m.client_surname}`, subtitle: `Visita Medica${dateStr}`, phone: m.client_phone, raw: m });
        });'''
content = re.sub(old_med, new_med, content)

with open("src/app/api/search/route.ts", "w") as f:
    f.write(content)

print("API mapping updated!")
