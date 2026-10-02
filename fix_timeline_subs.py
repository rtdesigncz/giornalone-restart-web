import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

# Add tipo_abbonamento_id to type
if 'tipo_abbonamento_id: string | null;' not in content:
    content = content.replace(
        'nuovo_abbonamento_name: string | null;',
        'tipo_abbonamento_id: string | null;\n  nuovo_abbonamento_name: string | null;'
    )

# Update fetch logic
old_fetch = r'''    async function fetchHistory\(\) \{
      setLoading\(true\);
      
      let query = supabase.from\("entries"\).select\("\*"\);'''

new_fetch = '''    async function fetchHistory() {
      setLoading(true);
      
      // Fetch tipi abbonamento per mappare l'ID al Nome
      const { data: tipiData } = await supabase.from("tipi_abbonamento").select("id, name");
      const tipiMap: Record<string, string> = {};
      if (tipiData) {
        tipiData.forEach(t => { tipiMap[t.id] = t.name || t.nome || "Sconosciuto"; });
      }

      let query = supabase.from("entries").select("*");'''

content = re.sub(old_fetch, new_fetch, content)

old_set_events = r'''      if \(!error && data\) \{
        setEvents\(data\);
      \}'''

new_set_events = '''      if (!error && data) {
        const mappedData = data.map(ev => ({
          ...ev,
          nuovo_abbonamento_name: ev.tipo_abbonamento_id ? tipiMap[ev.tipo_abbonamento_id] : null
        }));
        setEvents(mappedData);
      }'''

content = re.sub(old_set_events, new_set_events, content)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Timeline subs fixed")
