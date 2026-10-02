import re

with open("src/components/agenda/AgendaMobileList.tsx", "r") as f:
    content = f.read()

# Make sure useSearchParams is imported
if "useSearchParams" not in content:
    content = content.replace('import { useRouter } from "next/navigation";', 'import { useRouter, useSearchParams } from "next/navigation";')

# Add hooks
hook_code = """    const sp = useSearchParams();
    const highlightId = sp?.get("highlight");
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

# Update div class
old_div = r'<div key=\{row\.id\} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">'
new_div = '<div key={row.id} id={`row-${row.id}`} className={cn("rounded-xl shadow-sm border p-4 space-y-4 transition-all duration-700", flashId === row.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.02]" : "bg-white border-slate-100")}>'

content = re.sub(old_div, new_div, content)

with open("src/components/agenda/AgendaMobileList.tsx", "w") as f:
    f.write(content)
print("AgendaMobileList updated!")
