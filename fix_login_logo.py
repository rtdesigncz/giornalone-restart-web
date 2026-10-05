import re

with open("src/app/login/page.tsx", "r") as f:
    content = f.read()

# Add Image import if not present
if 'import Image' not in content:
    content = content.replace(
        'import { useRouter } from "next/navigation";',
        'import { useRouter } from "next/navigation";\nimport Image from "next/image";'
    )

old_h1 = r'<h1 className="text-xl font-semibold text-center">Accedi<\/h1>'
new_h1 = '''<div className="flex justify-center mb-6 mt-2">
          <Image src="/app-logo.png" alt="Restart Logo" width={180} height={40} className="object-contain" priority />
        </div>
        <h1 className="text-xl font-semibold text-center text-slate-800">Accedi</h1>'''

content = re.sub(old_h1, new_h1, content)

with open("src/app/login/page.tsx", "w") as f:
    f.write(content)

print("Logo added to login page")
