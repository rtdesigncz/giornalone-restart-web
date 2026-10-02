import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

old_nome = """                if (sortConfig.key === "nome") {
                    aVal = `${a.nome || ""} ${a.cognome || ""}`.trim().toLowerCase();
                    bVal = `${b.nome || ""} ${b.cognome || ""}`.trim().toLowerCase();
                }"""

new_nome = """                if (sortConfig.key === "nome") {
                    aVal = `${a.cognome || ""} ${a.nome || ""}`.trim().toLowerCase();
                    bVal = `${b.cognome || ""} ${b.nome || ""}`.trim().toLowerCase();
                }"""

content = content.replace(old_nome, new_nome)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze updated!")
