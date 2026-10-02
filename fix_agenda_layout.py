import re

with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

old_wrapper = r'<div className="space-y-6 flex flex-col animate-in-up">'
new_wrapper = '<div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 lg:p-8 animate-in-up space-y-6">'
content = re.sub(old_wrapper, new_wrapper, content)

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)

print("Agenda layout updated!")
