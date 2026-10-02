import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

old_body = r'body \{\n  @apply bg-\[\#fafafa\] text-slate-900;\n\}'
new_body = """body {
  @apply bg-[#fafafa] text-slate-900 font-sans antialiased;
}"""
content = re.sub(old_body, new_body, content)

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("Body CSS updated!")
