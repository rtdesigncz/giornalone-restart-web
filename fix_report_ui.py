import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# 1. Update kpis.recuperati to count row.isRecuperato
old_kpi_recuperati = """        const recup = r.filter((x: any) => !!x.conversion).length;"""
new_kpi_recuperati = """        const recup = r.filter((x: any) => !!x.isRecuperato).length;"""
content = content.replace(old_kpi_recuperati, new_kpi_recuperati)

# 2. Update filteredRows logic: remove "Recuperati" from the filter matching!
old_filter_logic = """                if (selectedEsiti.includes("Assenti") && row.assente) match = true;
                if (selectedEsiti.includes("Recuperati") && !!row.conversion) match = true;
                if (selectedEsiti.includes("Contattati") && row.contattato) match = true;"""
new_filter_logic = """                if (selectedEsiti.includes("Assenti") && row.assente) match = true;
                if (selectedEsiti.includes("Contattati") && row.contattato) match = true;"""
content = content.replace(old_filter_logic, new_filter_logic)

# 3. Remove "Recuperati" from the Esito dropdown options
old_dropdown_options = """                                <DropdownFilter 
                                    label="Esito" 
                                    options={["Presentati", "Venduti", "Miss", "Assenti", "Recuperati", "Contattati", "Negativi"]} 
                                    selected={selectedEsiti}"""
new_dropdown_options = """                                <DropdownFilter 
                                    label="Esito" 
                                    options={["Presentati", "Venduti", "Miss", "Assenti", "Contattati", "Negativi"]} 
                                    selected={selectedEsiti}"""
content = content.replace(old_dropdown_options, new_dropdown_options)

# 4. Remove the `onClick` from the Recuperati KPI card so it's strictly informational
old_recuperati_card = """                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Recuperati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-cyan-300 hover:shadow-md transition-all group", selectedEsiti.includes("Recuperati") ? "ring-2 ring-cyan-500 border-transparent bg-cyan-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide group-hover:text-cyan-800">Recuperati</h3><RefreshCw className="w-4 h-4 text-cyan-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.recuperati || 0}</p>
                            </div>"""

new_recuperati_card = """                            <div className={cn("saas-panel p-3 border-cyan-100 bg-cyan-50/30 group")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide">Recuperati (Info)</h3><RefreshCw className="w-4 h-4 text-cyan-500" /></div>
                                <p className="text-xl font-extrabold text-cyan-900">{kpis.recuperati || 0}</p>
                            </div>"""
content = content.replace(old_recuperati_card, new_recuperati_card)

# 5. Display the badge in the Conversione column
old_conversione = """                                                <td className="px-6 py-3 whitespace-nowrap text-center text-xs">
                                                    {row.conversion ? (
                                                        <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                                            <Check className="w-3 h-3" />
                                                            {formatDate(row.conversion.date)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>"""

new_conversione = """                                                <td className="px-6 py-3 whitespace-nowrap text-center text-xs">
                                                    {row.isRecuperato ? (
                                                        <div className="flex items-center justify-center gap-1 text-cyan-700 font-bold bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200" title="Questo venduto deriva da un contatto precedente">
                                                            <RefreshCw className="w-3 h-3" />
                                                            RECUPERATO
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>"""
content = content.replace(old_conversione, new_conversione)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("UI updated!")
