import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

old_desktop = """<div className="font-bold text-slate-800 text-sm">{cleanName(r.nome)} {cleanName(r.cognome)}</div>"""
new_desktop = """<div className="font-bold text-slate-800 text-sm">{cleanName(r.cognome)} {cleanName(r.nome)}</div>"""

old_mobile = """<div className="font-bold text-slate-800 text-lg">{cleanName(r.nome)} {cleanName(r.cognome)}</div>"""
new_mobile = """<div className="font-bold text-slate-800 text-lg">{cleanName(r.cognome)} {cleanName(r.nome)}</div>"""

content = content.replace(old_desktop, new_desktop)
content = content.replace(old_mobile, new_mobile)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze display updated!")
