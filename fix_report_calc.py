import re

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'const daFissare = contattati - appuntamentiFissati;',
    'const daFissare = items.filter(i => i.contattato && !i.preso_appuntamento).length;'
)

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "w") as f:
    f.write(content)

print("Report calc patched")
