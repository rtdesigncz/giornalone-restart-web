import re

with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r'const displayCommands = query\.length < 2\s*\?\s*navCommands\s*:\s*dbResults;',
    'const displayCommands = dbResults;',
    content
)

with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)
print("Display commands fixed!")
