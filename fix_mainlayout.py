import re

with open("src/components/layout/MainLayout.tsx", "r") as f:
    content = f.read()

old_logic = r'const isFullWidth = pathname\?.startsWith\("/consulenze"\) \|\| pathname\?.startsWith\("/reportistica"\) \|\| pathname\?.startsWith\("/consegna-pass"\);'
new_logic = 'const isFullWidth = pathname?.startsWith("/consulenze") || pathname?.startsWith("/reportistica") || pathname?.startsWith("/consegna-pass") || pathname?.startsWith("/agenda") || pathname?.startsWith("/visite-mediche");'

content = re.sub(old_logic, new_logic, content)

with open("src/components/layout/MainLayout.tsx", "w") as f:
    f.write(content)

print("MainLayout updated!")
