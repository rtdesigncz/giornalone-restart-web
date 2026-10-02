import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Provide fallbacks to avoid undefined/null in URL
old_router = r'router\.push\(`/agenda\?section=\$\{encodeURIComponent\(entry\.section\)\}&date=\$\{entry\.entry_date\}&highlight=\$\{entry\.id\}`\);'
new_router = r'router.push(`/agenda?section=${encodeURIComponent(entry.section || "TOUR SPONTANEI")}&date=${entry.entry_date || new Date().toISOString().split("T")[0]}&highlight=${entry.id}`);'

content = content.replace(old_router, new_router)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("AbsentListPopup router patched with safety checks!")
