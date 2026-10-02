import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

old_container = r'<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative w-full">'
new_container = '<div className="w-full">'
content = re.sub(old_container, new_container, content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)
