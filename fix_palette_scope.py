import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

# The helpers were injected wrongly. Let's find them and remove them.
helpers_pattern = r'\s*const getThemeClasses = .*?return "bg-slate-100 text-slate-500";\n\s*\};\n'
# Actually, the best way is to reconstruct.
# Let's just find the injected block and move it up.
import os

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    lines = f.read().split('\n')

# Find where getThemeClasses starts
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const getThemeClasses =" in line:
        start_idx = i
    if start_idx != -1 and "const getBadgeClasses =" in lines[i] and "};" in lines[i+5]:
        end_idx = i + 5
        break

if start_idx != -1 and end_idx != -1:
    block = lines[start_idx:end_idx+1]
    del lines[start_idx:end_idx+1]
    
    # We also have to fix the corrupted return
    # It probably looks like:
    # return ( () => document.removeEventListener("keydown", down);
    # because my script replaced "return (" with "helpers \n return ("
    # Let's check lines[start_idx-1] and lines[start_idx]
    for i, line in enumerate(lines):
        if '() => document.removeEventListener("keydown", down);' in line:
            lines[i] = '        return () => document.removeEventListener("keydown", down);'
            
    # Insert block BEFORE export default function CommandPalette()
    insert_idx = -1
    for i, line in enumerate(lines):
        if "export default function CommandPalette" in line:
            insert_idx = i
            break
            
    if insert_idx != -1:
        for j, b in enumerate(block):
            lines.insert(insert_idx + j, b)
            
    with open("src/components/ui/CommandPalette.tsx", "w") as f:
        f.write('\n'.join(lines))
    print("Scope fixed!")
else:
    print("Could not find block!")
