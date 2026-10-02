import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Replace `r.conversion` with `r.isRecuperato` in the KPI calculation
old_code = r'recuperati: source\.filter\(r => r\.conversion\)\.length'
new_code = 'recuperati: source.filter(r => r.isRecuperato).length'

content = re.sub(old_code, new_code, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("KPI calculation fixed!")
