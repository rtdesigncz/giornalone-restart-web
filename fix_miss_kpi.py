import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Update KPI miss calculation
content = content.replace(
    'miss: source.filter(r => r.miss).length,',
    'miss: source.filter(r => r.miss && !(r as any).isRecuperato).length,'
)

# Update Badge text
content = content.replace(
    'RECUPERATO\n                                                            </span>',
    'MISS RECUPERATO\n                                                            </span>'
)

# Also there's a tooltip: title="Questo venduto deriva da un contatto precedente"
# I should change it or leave it. "Questo contatto ha comprato in un appuntamento successivo" might be better since it's on the original row now.
content = content.replace(
    'title="Questo venduto deriva da un contatto precedente"',
    'title="Questo contatto ha acquistato in un appuntamento successivo"'
)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Miss KPI and Badge updated")
