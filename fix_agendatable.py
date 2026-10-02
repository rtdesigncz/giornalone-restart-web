import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

# Make table container like Option 3
old_container = r'<div className="w-full">'
new_container = '<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative w-full">'
content = re.sub(old_container, new_container, content)

# Make table header like Option 3
old_thead = r'<thead className="bg-slate-50\/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">'
new_thead = '<thead className="bg-white sticky top-0 z-10">'
content = re.sub(old_thead, new_thead, content)

# Make TH like Option 3
old_th = r'className="py-4 px-6 text-\[11px\] font-bold text-slate-500 uppercase tracking-wider(.*)"'
# need to handle group matching for the rest of the class
def repl_th(m):
    return f'className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border-b border-slate-200{m.group(1)}"'

content = re.sub(old_th, repl_th, content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)

print("AgendaTable updated!")
