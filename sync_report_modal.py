import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'items={items} \n                listName={gestioni.find(g => g.id === gestioneId)?.nome || ""} ',
    'items={rows} \n                listName={gestioni.find(g => g.id === gestioneId)?.nome || ""} '
)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Synced modal with rows")
