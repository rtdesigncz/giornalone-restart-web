import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

old_input = """                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo Abbonamento</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Es. MENSILE"
                                value={newRecord.tipo_abbonamento_corrente}
                                onChange={e => setNewRecord({ ...newRecord, tipo_abbonamento_corrente: e.target.value })}
                            />"""

new_input = """                            <label className="text-xs font-bold text-slate-500 uppercase">Tipo Abbonamento</label>
                            <select
                                className="input w-full"
                                value={newRecord.tipo_abbonamento_corrente}
                                onChange={e => setNewRecord({ ...newRecord, tipo_abbonamento_corrente: e.target.value })}
                            >
                                <option value="">— Seleziona —</option>
                                {abbOptions.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>"""

content = content.replace(old_input, new_input)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)
print("Input replaced with select!")
