import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '{ev.venduto && ev.nuovo_abbonamento_name && (',
    '{ev.venduto && ('
)

content = content.replace(
    '+ {ev.nuovo_abbonamento_name}',
    '+ {ev.nuovo_abbonamento_name || "TIPO NON SPECIFICATO"}'
)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Fixed null subs display")
