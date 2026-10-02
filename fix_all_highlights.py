import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

old_tr = r'<tr\s*key=\{row\.id\}\s*onClick=\{.*?\}\s*className="hover:bg-sky-50/50 cursor-pointer transition-colors group animate-in-up"'
new_tr = '<tr key={row.id} id={`row-${row.id}`} onClick={() => handleRowClick(row)} className={cn("cursor-pointer transition-all duration-700 group animate-in-up", flashId === String(row.id) ? "bg-amber-100 ring-inset ring-2 ring-amber-400" : "hover:bg-sky-50/50")}'
content = re.sub(old_tr, new_tr, content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)


with open("src/components/agenda/AgendaMobileList.tsx", "r") as f:
    content = f.read()

old_div = r'<div\s*key=\{row\.id\}\s*onClick=\{.*?\}\s*className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 active:scale-\[0\.98\] transition-all cursor-pointer"'
new_div = '<div key={row.id} id={`row-${row.id}`} onClick={() => handleRowClick(row)} className={cn("rounded-2xl border shadow-sm p-4 active:scale-[0.98] cursor-pointer transition-all duration-700", flashId === String(row.id) ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.02]" : "bg-white border-slate-100")}'
content = re.sub(old_div, new_div, content)

with open("src/components/agenda/AgendaMobileList.tsx", "w") as f:
    f.write(content)

print("Agenda files fixed!")
