import re

with open("src/components/agenda/AgendaMobileList.tsx", "r") as f:
    content = f.read()

# Add useSearchParams if not there
if "useSearchParams" not in content:
    content = content.replace('import { useRouter } from "next/navigation";', 'import { useRouter, useSearchParams } from "next/navigation";')

# Inject hooks
hook_code = """    const router = useRouter();
    const sp = useSearchParams();
    const dateParam = sp?.get("date") ?? getLocalDateISO();
    
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

old_hooks = r'const router = useRouter\(\);\n\s*const sp = useSearchParams\(\);\n\s*const dateParam = sp\?\.get\("date"\) \?\? getLocalDateISO\(\);'
content = re.sub(old_hooks, hook_code, content)

# Inject id and flash class into EntryCard wrapper
# Wait, EntryCard is rendered as <EntryCard ... />
# We need to wrap EntryCard in a div OR modify EntryCard to accept id and className.
# Wrapping EntryCard in a div is easiest.
old_card = r'<EntryCard\n\s*key=\{row\.id\}\n\s*row=\{row\}'
new_card = '<div key={row.id} id={`row-${row.id}`} className={cn("transition-all duration-700 rounded-2xl", flashId === String(row.id) ? "ring-4 ring-amber-400 scale-[1.02]" : "")}><EntryCard\n                            row={row}'
content = re.sub(old_card, new_card, content)
content = content.replace('/>\n                    ))', '/>\n                        </div>\n                    ))')

# Make sure cn is imported
if 'import { cn } from "@/lib/utils";' not in content:
    content = 'import { cn } from "@/lib/utils";\n' + content

with open("src/components/agenda/AgendaMobileList.tsx", "w") as f:
    f.write(content)

print("AgendaMobileList fixed!")
