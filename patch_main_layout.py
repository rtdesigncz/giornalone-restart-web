import re

with open("src/components/layout/MainLayout.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900"',
    'className="flex h-screen bg-background overflow-hidden font-sans text-foreground"'
)

with open("src/components/layout/MainLayout.tsx", "w") as f:
    f.write(content)

print("MainLayout patched")
