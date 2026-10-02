import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'await supabase.from("tipi_abbonamento").select("id, name");',
    'await supabase.from("tipi_abbonamento").select("*");'
)

content = content.replace(
    't.name || "Sconosciuto"',
    't.name || t.nome || "Sconosciuto"'
)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Fixed fields for tipi_abbonamento")
