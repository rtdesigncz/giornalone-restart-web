import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'uppercase tracking-wide">Recuperati</h3>',
    'uppercase tracking-wide">Miss Recuperati</h3>'
)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("KPI label updated")
