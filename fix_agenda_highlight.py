import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

# Add flashId state and useEffect
hook_code = """    const highlightId = sp?.get("highlight");
    const [flashId, setFlashId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightId && rows.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setFlashId(highlightId);
                    setTimeout(() => setFlashId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, rows]);
"""

content = content.replace('const isTelefonici = section === "APPUNTAMENTI TELEFONICI";', hook_code + '\n    const isTelefonici = section === "APPUNTAMENTI TELEFONICI";')

# Update TR class
old_tr = r'<tr key=\{row\.id\} className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-transparent hover:border-brand/20">'
new_tr = '<tr key={row.id} id={`row-${row.id}`} className={cn("group shadow-sm hover:shadow-md transition-all duration-700 rounded-xl border", flashId === row.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.01]" : "bg-white border-transparent hover:border-brand/20")}>'

content = re.sub(old_tr, new_tr, content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)
print("AgendaTable updated!")
