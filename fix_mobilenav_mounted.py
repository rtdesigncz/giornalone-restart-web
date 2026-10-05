import re

with open("src/components/layout/MobileNav.tsx", "r") as f:
    content = f.read()

# Remove early return
content = content.replace("    if (!mounted) return null;", "")

with open("src/components/layout/MobileNav.tsx", "w") as f:
    f.write(content)

print("MobileNav mounted fixed")
