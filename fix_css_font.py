import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

# Replace body to strictly enforce font family natively in CSS
old_body = r'body \{\n  @apply bg-\[\#fafafa\] text-slate-900 font-sans antialiased;\n\}'
new_body = """body {
  @apply bg-[#fafafa] text-slate-900 antialiased;
  font-family: var(--font-outfit), 'Outfit', 'Inter', system-ui, -apple-system, sans-serif !important;
}"""
content = re.sub(old_body, new_body, content)

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("Body font strictly enforced in CSS!")
