import re

with open("src/components/medical/SessionManager.tsx", "r") as f:
    content = f.read()

if "useSearchParams" not in content:
    content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useSearchParams } from "next/navigation";')

hook_code = """    const sp = useSearchParams();
    const urlSession = sp?.get("session");
"""
if "const sp = useSearchParams" not in content:
    content = re.sub(r'(export default function SessionManager\(\) \{\n)', r'\1' + hook_code, content)

content = content.replace('if (data && data.length > 0 && !selectedSessionId) {\n                // Logic to select nearest future date could go here, for now just pick first\n                setSelectedSessionId(data[0].id);\n            }', 'if (data && data.length > 0 && !selectedSessionId) {\n                setSelectedSessionId(urlSession || data[0].id);\n            }')

with open("src/components/medical/SessionManager.tsx", "w") as f:
    f.write(content)

# AppointmentTable.tsx
with open("src/components/medical/AppointmentTable.tsx", "r") as f:
    content = f.read()

if "useSearchParams" not in content:
    content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useSearchParams } from "next/navigation";')

hook_code_app = """    const sp = useSearchParams();
    const highlightId = sp?.get("highlight");
    const [flashId, setFlashId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightId && appointments.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setFlashId(highlightId);
                    setTimeout(() => setFlashId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, appointments]);
"""
if "const sp = useSearchParams" not in content:
    content = re.sub(r'(export default function AppointmentTable\(\{ sessionId \}: \{ sessionId: string \}\) \{\n)', r'\1' + hook_code_app, content)

old_tr = r'<tr key=\{app\.id\} className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-transparent hover:border-brand/20">'
new_tr = '<tr key={app.id} id={`row-${app.id}`} className={cn("group shadow-sm hover:shadow-md transition-all duration-700 rounded-xl border", flashId === app.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.01]" : "bg-white border-transparent hover:border-brand/20")}>'
content = re.sub(old_tr, new_tr, content)

with open("src/components/medical/AppointmentTable.tsx", "w") as f:
    f.write(content)


# WaitingList.tsx
with open("src/components/medical/WaitingList.tsx", "r") as f:
    content = f.read()

if "useSearchParams" not in content:
    content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useSearchParams } from "next/navigation";')

hook_code_wait = """    const sp = useSearchParams();
    const highlightId = sp?.get("highlight");
    const [flashId, setFlashId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightId && waitingList.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    setFlashId(highlightId);
                    setTimeout(() => setFlashId(null), 3000);
                }
            }, 300);
        }
    }, [highlightId, waitingList]);
"""
if "const sp = useSearchParams" not in content:
    content = re.sub(r'(export default function WaitingList\(\) \{\n)', r'\1' + hook_code_wait, content)

old_tr_w = r'<tr key=\{item\.id\} className="group bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-transparent hover:border-amber-200">'
new_tr_w = '<tr key={item.id} id={`row-${item.id}`} className={cn("group shadow-sm hover:shadow-md transition-all duration-700 rounded-xl border", flashId === item.id ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-[1.01]" : "bg-white border-transparent hover:border-amber-200")}>'
content = re.sub(old_tr_w, new_tr_w, content)

with open("src/components/medical/WaitingList.tsx", "w") as f:
    f.write(content)

print("Medical features updated!")
