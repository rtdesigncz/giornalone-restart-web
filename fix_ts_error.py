import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    't.name || t.nome || "Sconosciuto"',
    't.name || "Sconosciuto"'
)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("TS error fixed")
