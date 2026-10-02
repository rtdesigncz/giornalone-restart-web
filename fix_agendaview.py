import re

with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

# Fix the main container
old_container = r'<div className="glass-card relative border border-slate-200/60 bg-white/50">'
new_container = '<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">'
content = re.sub(old_container, new_container, content)

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)

print("AgendaView container updated!")
