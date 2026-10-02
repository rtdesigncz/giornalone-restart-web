import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

content = content.replace(
    "@apply bg-[#fafafa] text-slate-900 antialiased;",
    "@apply bg-background text-foreground antialiased;"
)

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("body css patched")
