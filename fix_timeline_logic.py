import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

# 1. Update TimelineEvent type
old_type = r'''  entry_date: string;
  time: string \| null;'''
new_type = '''  entry_date: string;
  entry_time: string | null;
  consulente_id: string | null;
  consulente_name: string | null;'''
content = re.sub(old_type, new_type, content)

# 2. Add Consulenti map in fetchHistory
old_fetch = r'''      if \(tipiData\) \{
        tipiData\.forEach\(t => \{ tipiMap\[t\.id\] = t\.name \|\| t\.nome \|\| "Sconosciuto"; \}\);
      \}

      let query = supabase\.from\("entries"\)\.select\("\*"\);'''

new_fetch = '''      if (tipiData) {
        tipiData.forEach(t => { tipiMap[t.id] = t.name || t.nome || "Sconosciuto"; });
      }

      const { data: consulentiData } = await supabase.from("consulenti").select("*");
      const consulentiMap: Record<string, string> = {};
      if (consulentiData) {
        consulentiData.forEach(c => { consulentiMap[c.id] = c.name || c.nome || "Sconosciuto"; });
      }

      let query = supabase.from("entries").select("*");'''
content = re.sub(old_fetch, new_fetch, content)

# 3. Add consulente_name to mapping
old_map = r'''          nuovo_abbonamento_name: ev\.tipo_abbonamento_id \? tipiMap\[ev\.tipo_abbonamento_id\] : null
        \}\)\);'''
new_map = '''          nuovo_abbonamento_name: ev.tipo_abbonamento_id ? tipiMap[ev.tipo_abbonamento_id] : null,
          consulente_name: ev.consulente_id ? consulentiMap[ev.consulente_id] : null
        }));'''
content = re.sub(old_map, new_map, content)

# 4. Update the render loop logic
old_logic = r'''                let Icon = Calendar;
                let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
                let statusText = "In programma";
                
                if \(ev\.venduto\) \{
                  Icon = CheckCircle2;
                  colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                  statusText = "Venduto";
                \} else if \(ev\.assente\) \{
                  Icon = AlertCircle;
                  colorClass = "bg-rose-100 text-rose-500 border-rose-200";
                  statusText = "Assente";
                \} else if \(ev\.miss\) \{
                  Icon = XCircle;
                  colorClass = "bg-orange-100 text-orange-500 border-orange-200";
                  statusText = "Miss";
                \} else if \(new Date\(ev\.entry_date\) < new Date\(\)\) \{
                   statusText = "Svolto";
                \}'''

new_logic = '''                let Icon = Calendar;
                
                const now = new Date();
                const eventDate = new Date(`${ev.entry_date}T${ev.entry_time || "00:00:00"}`);
                const isPast = eventDate < now;
                
                let colorClass = isPast ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-500 border-blue-200";
                let statusText = isPast ? "Senza Esito" : "Da Svolgere";
                
                if (ev.venduto) {
                  Icon = CheckCircle2;
                  colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                  statusText = "Venduto";
                } else if (ev.assente) {
                  Icon = AlertCircle;
                  colorClass = "bg-rose-100 text-rose-500 border-rose-200";
                  statusText = "Assente";
                } else if (ev.miss) {
                  Icon = XCircle;
                  colorClass = "bg-orange-100 text-orange-500 border-orange-200";
                  statusText = "Miss";
                } else if (ev.esito) {
                  // Se ha un esito (non nullo) ma non rientra nei 3 sopra
                  statusText = "Svolto";
                }'''
content = re.sub(old_logic, new_logic, content)

# 5. Fix time variable name and add consulente badge
old_card_head = r'''                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Calendar size=\{12\} className="text-slate-400" \/>
                          \{formatDate\(ev\.entry_date\)\} \{ev\.time \? `• \$\{ev\.time\}` : ""\}
                        \<\/span\>'''
new_card_head = '''                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(ev.entry_date)} {ev.entry_time ? `• ${ev.entry_time.slice(0, 5)}` : ""}
                        </span>'''
content = re.sub(old_card_head, new_card_head, content)

old_card_body = r'''                        <div className="flex items-center gap-2">
                          <ArrowRight size=\{14\} className="text-brand" \/>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">\{ev\.section\}\<\/span\>
                        \<\/div\>'''
new_card_body = '''                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight size={14} className="text-brand" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{ev.section}</span>
                          </div>
                          {ev.consulente_name && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase truncate max-w-[120px]">
                              {ev.consulente_name}
                            </span>
                          )}
                        </div>'''
content = re.sub(old_card_body, new_card_body, content)


with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Logic fixed")
