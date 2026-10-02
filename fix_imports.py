import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Add useRouter import
if "import { useRouter }" not in content:
    content = content.replace('import { getSectionLabel } from "@/lib/sections";', 'import { getSectionLabel } from "@/lib/sections";\nimport { useRouter } from "next/navigation";')

# Add ExternalLink to lucide-react imports
if "ExternalLink" not in content:
    content = re.sub(r'import \{ (.*?) \} from "lucide-react";', r'import { \1, ExternalLink } from "lucide-react";', content)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("Imports fixed!")
