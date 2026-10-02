import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Fix confirmAction (Modal)
old_set_esito = r"\} else if \(type === 'SET_ESITO'\) \{\n\s*updated\.contattato = true;"
new_set_esito = r"""} else if (type === 'SET_ESITO') {
            if (tempEsito && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(tempEsito)) {
                if (!tempNuovoAbb) {
                    alert("ATTENZIONE: Devi obbligatoriamente selezionare il Nuovo Abbonamento per salvare un esito positivo.");
                    return;
                }
            }
            updated.contattato = true;"""
content = re.sub(old_set_esito, new_set_esito, content)


# Fix salvaModifica (Inline Editing)
old_salva = r"const salvaModifica = async \(id: string\) => \{\n\s*const r = items\.find\(x => x\.id === id\);\n\s*if \(\!r\) return;"
new_salva = r"""const salvaModifica = async (id: string) => {
        const r = items.find(x => x.id === id);
        if (!r) return;
        
        if (r.esito && ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(r.esito)) {
            if (!r.nuovo_abbonamento_name) {
                alert("ATTENZIONE: Devi obbligatoriamente selezionare il Nuovo Abbonamento per salvare un esito positivo.");
                return;
            }
        }"""
content = re.sub(old_salva, new_salva, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze validation added!")
