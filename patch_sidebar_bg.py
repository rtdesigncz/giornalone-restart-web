import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace('bg-[#fbfbfb]', 'bg-card')

with open("src/components/layout/Sidebar.tsx", "w") as f:
    f.write(content)

print("Sidebar bg patched")
