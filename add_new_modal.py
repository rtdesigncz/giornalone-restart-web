import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Add states for new modal
state_addition = """    const [showFilters, setShowFilters] = useState(false);"""
# I already deleted showFilters, so I'll insert after showImport
new_states = """    const [showNewModal, setShowNewModal] = useState(false);
    const [newRecord, setNewRecord] = useState({ nome: "", cognome: "", telefono: "", tipo_abbonamento_corrente: "", scadenza: "" });"""
content = content.replace("const [showImport, setShowImport] = useState(false);", "const [showImport, setShowImport] = useState(false);\n" + new_states)

# 2. Modify aggiungiRiga
old_aggiungiRiga = """    const aggiungiRiga = () => {
        if (!gestioneId) { alert("Seleziona una gestione"); return; }
        const tmp: Item = {
            id: `tmp-${Date.now()}`,
            gestione_id: gestioneId,
            nome: "", cognome: "", telefono: "",
            scadenza: "", tipo_abbonamento_corrente: "",
            contattato: false, preso_appuntamento: false, consulenza_fatta: false,
            data_consulenza: "", esito: null, nuovo_abbonamento_name: null, data_risposta: "",
            note: "",
            _isDraft: true, _editing: true,
        };
        setItems([tmp, ...items]);
    };"""

new_aggiungiRiga = """    const aggiungiRiga = () => {
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

content = content.replace(old_aggiungiRiga, new_aggiungiRiga)

# 3. Add the modal UI
modal_ui = """
            {/* New Record Modal */}
            <ActionModal
                isOpen={showNewModal}
                title="Nuovo Cliente"
                confirmLabel="Salva Cliente"
                onClose={() => setShowNewModal(false)}
                onConfirm={confermaNuovo}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Mario"
                                value={newRecord.nome}
                                onChange={e => setNewRecord({ ...newRecord, nome: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cognome</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Rossi"
                                value={newRecord.cognome}
                                onChange={e => setNewRecord({ ...newRecord, cognome: e.target.value })}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="333 1234567"
                            value={newRecord.telefono}
                            onChange={e => setNewRecord({ ...newRecord, telefono: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo Abbonamento</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Es. MENSILE"
                                value={newRecord.tipo_abbonamento_corrente}
                                onChange={e => setNewRecord({ ...newRecord, tipo_abbonamento_corrente: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Scadenza</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={newRecord.scadenza}
                                onChange={e => setNewRecord({ ...newRecord, scadenza: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </ActionModal>
"""

# Insert it after showImport modal
content = content.replace("                />\n            )}", "                />\n            )}\n" + modal_ui)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("New modal added!")
