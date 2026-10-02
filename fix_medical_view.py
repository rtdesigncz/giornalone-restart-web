import re

with open("src/components/medical/MedicalVisitsView.tsx", "r") as f:
    content = f.read()

# Add useSearchParams
if "useSearchParams" not in content:
    content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";\nimport { useSearchParams } from "next/navigation";')

# Read URL params
hook_code = """    const sp = useSearchParams();
    const urlTab = sp?.get("tab") as "appointments" | "waiting" | null;
    const [activeTab, setActiveTab] = useState<"appointments" | "waiting">(urlTab || "appointments");

    useEffect(() => {
        if (urlTab) setActiveTab(urlTab);
    }, [urlTab]);
"""

content = re.sub(r'const \[activeTab, setActiveTab\] = useState<"appointments" \| "waiting">\("appointments"\);', hook_code, content)

with open("src/components/medical/MedicalVisitsView.tsx", "w") as f:
    f.write(content)
print("MedicalVisitsView updated!")
