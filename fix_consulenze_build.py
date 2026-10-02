import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Replace fAppuntamenti with fAppDaFare in the dependency array
old_dep = r'\[items, q, fContattati, fDaContattare, fAppuntamenti, fConsFatte, fEsiti, fAbb\]'
new_dep = '[items, q, fContattati, fDaContattare, fAppDaFare, fConsFatte, fEsiti, fAbb]'
content = re.sub(old_dep, new_dep, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Dependency array fixed!")
