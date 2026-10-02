import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "useSearchParams" not in content:
    content = content.replace('import { usePathname', 'import { usePathname, useSearchParams')
    if "useSearchParams" not in content:
        content = content.replace('import { useEffect, useMemo, useState } from "react";', 'import { useEffect, useMemo, useState } from "react";\nimport { useSearchParams } from "next/navigation";')

# 2. Extract hook
hook_injection = """    const searchParams = useSearchParams();
    const highlightId = searchParams.get("highlight");
    const urlGestioneId = searchParams.get("gestione");
"""
if "const searchParams" not in content:
    content = re.sub(r'(export default function ConsulenzeClientV2\(\) \{\n)', r'\1' + hook_injection, content)

# 3. Use urlGestioneId for initial load
# Wait, currently the lists are fetched in useEffect.
# Let's see how `selectedId` is set.
# Probably `setSelectedId(j[0].id)`.
# We should change it to `setSelectedId(urlGestioneId || j[0].id)`.
