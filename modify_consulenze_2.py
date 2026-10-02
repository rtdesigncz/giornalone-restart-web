import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Add fDaContattare state
content = content.replace('const [fContattati, setFContattati] = useState(false);', 'const [fContattati, setFContattati] = useState(false);\n    const [fDaContattare, setFDaContattare] = useState(false);')
content = content.replace('setQ(""); setFContattati(false); setFAppuntamenti(false);', 'setQ(""); setFContattati(false); setFDaContattare(false); setFAppuntamenti(false);')

# Add fDaContattare logic to rows filter
filter_logic = """
            if (fContattati && !r.contattato) return false;
            if (fDaContattare && r.contattato) return false;
"""
content = content.replace('if (fContattati && !r.contattato) return false;', filter_logic)

# Fix the 'Da Contattare' card click handler
content = content.replace('onClick={() => { resetFiltri(); }} className="saas-panel p-4 cursor-pointer', 'onClick={() => { resetFiltri(); setFDaContattare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fDaContattare ? "ring-2 ring-amber-500 border-transparent" : "")}')

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Modification 2 done!")
