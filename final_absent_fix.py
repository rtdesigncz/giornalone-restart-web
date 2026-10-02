import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Fix the routing
content = content.replace("router.push(`/agenda?section=${encodeURIComponent(entry.section)}&date=${entry.entry_date}&highlight=${entry.id}`);",
"router.push(`/agenda?section=${encodeURIComponent(entry.section || 'TOUR SPONTANEI')}&date=${entry.entry_date || new Date().toISOString().split('T')[0]}&highlight=${entry.id}`);")

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)
print("done")
