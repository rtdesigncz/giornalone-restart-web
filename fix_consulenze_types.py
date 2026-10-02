import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Fix desktop flash comparison
content = content.replace('flashId === r.id ?', 'flashId === String(r.id) ?')

# Fix mobile flash comparison
# I think it's the same string. I'll replace globally:
# Actually wait, `flashId === r.id` appears twice.
with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze types fixed!")
