import re

with open("src/app/agenda/page.tsx", "r") as f:
    content = f.read()

new_content = "export const dynamic = 'force-dynamic';\n\n" + content

with open("src/app/agenda/page.tsx", "w") as f:
    f.write(new_content)

print("Agenda page set to force-dynamic!")
