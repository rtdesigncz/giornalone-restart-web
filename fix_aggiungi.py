import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Use regex to find and replace the whole block
aggiungi_regex = r'const aggiungiRiga = \(\) => \{[\s\S]*?setItems\(\(it\) => \[tmp, \.\.\.it\]\);\n    \};'

new_aggiungiRiga = """const aggiungiRiga = () => {
        if (!gestioneId) { alert("Seleziona una gestione"); return; }
        setNewRecord({ nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "" });
        setShowNewModal(true);
    };

    const confermaNuovo = async () => {
        if (!newRecord.nome && !newRecord.cognome) {
            alert("Inserisci almeno il nome o il cognome");
            return;
        }
        const body = { gestione_id: gestioneId, ...newRecord };
        const res = await fetch(`/api/consulenze/items`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        if (!res.ok) { alert("Errore creazione riga"); return; }
        setShowNewModal(false);
        reloadItems(gestioneId);
    };"""

content = re.sub(aggiungi_regex, new_aggiungiRiga, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("aggiungiRiga replaced!")
