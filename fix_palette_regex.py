import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

# Extract the block
match = re.search(r'(\s*const getThemeClasses =.*?const getBadgeClasses =.*?return "bg-slate-100 text-slate-500";\n\s*\}\;)', content, re.DOTALL)
if match:
    block = match.group(1)
    content = content.replace(block, "")
    
    # Fix the broken return
    content = content.replace('        \n\n    return () => document.removeEventListener("keydown", down);', '        return () => document.removeEventListener("keydown", down);')
    content = content.replace('    return () => document.removeEventListener("keydown", down);', '        return () => document.removeEventListener("keydown", down);')
    
    # Insert block before export
    content = content.replace("export default function CommandPalette() {", block + "\nexport default function CommandPalette() {")
    
    with open("src/components/ui/CommandPalette.tsx", "w") as f:
        f.write(content)
    print("Fixed!")
else:
    print("Not found regex!")
