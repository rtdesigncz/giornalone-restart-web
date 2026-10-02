import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "useSearchParams" not in content:
    content = content.replace('import { useEffect, useMemo, useState } from "react";', 'import { useEffect, useMemo, useState } from "react";\nimport { useSearchParams } from "next/navigation";')

# 2. Add hook and effect
hook_code = """    const searchParams = useSearchParams();
    const highlightId = searchParams?.get("highlight");
    const urlGestioneId = searchParams?.get("gestione");

    const [flashId, setFlashId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightId && items.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setFlashId(highlightId);
                    setTimeout(() => setFlashId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, items]);
"""
if "const searchParams" not in content:
    content = re.sub(r'(export default function ConsulenzeClientV2\(\) \{\n)', r'\1' + hook_code, content)

# 3. Update gestioneId logic
content = content.replace(
    'if (!gestioneId && j.rows?.[0]?.id) setGestioneId(j.rows[0].id);',
    'if (!gestioneId && j.rows?.[0]?.id) setGestioneId(urlGestioneId || j.rows[0].id);'
)

# 4. Add id to desktop TR and flash class
old_tr = r'<tr key=\{r\.id\} className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-transparent hover:border-cyan-100">'
new_tr = '<tr key={r.id} id={`row-${r.id}`} className={cn("group shadow-sm hover:shadow-md transition-all duration-700 rounded-xl border", flashId === r.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.01]" : "bg-white border-transparent hover:border-cyan-100")}>'
content = re.sub(old_tr, new_tr, content)

# 5. Add id to mobile DIV and flash class
old_div = r'<div key=\{r\.id\} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">'
new_div = '<div key={r.id} id={`row-${r.id}`} className={cn("rounded-xl shadow-sm border p-4 space-y-4 transition-all duration-700", flashId === r.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.02]" : "bg-white border-slate-100")}>'
content = re.sub(old_div, new_div, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze highlight updated!")
