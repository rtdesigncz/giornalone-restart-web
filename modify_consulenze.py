import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Add sorting state
sort_state = """
    // SORTING STATE
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRows = useMemo(() => {
        let sortableItems = [...rows];
        if (sortConfig !== null) {
            sortableItems.sort((a: any, b: any) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                if (sortConfig.key === "nome") {
                    aVal = `${a.nome || ""} ${a.cognome || ""}`.trim().toLowerCase();
                    bVal = `${b.nome || ""} ${b.cognome || ""}`.trim().toLowerCase();
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                }
                if (typeof bVal === 'string') {
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [rows, sortConfig]);
"""
content = content.replace("const [q, setQ] = useState(\"\");", "const [q, setQ] = useState(\"\");" + sort_state)

# 2. Update the row mapping to use sortedRows instead of rows
content = content.replace("rows.length > 0 ? rows.map(r => {", "sortedRows.length > 0 ? sortedRows.map(r => {")
content = content.replace("rows.length === 0", "sortedRows.length === 0")

# 3. Change the table headers to be clickable
th_replacement = """
                                    <thead>
                                        <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                            <th className="pb-3 pl-4 whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('nome')}>
                                                Cliente {sortConfig?.key === 'nome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('scadenza')}>
                                                Abbonamento / Scadenza {sortConfig?.key === 'scadenza' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('data_consulenza')}>
                                                Stato / Data App. {sortConfig?.key === 'data_consulenza' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 text-center whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors" onClick={() => handleSort('esito')}>
                                                Esito {sortConfig?.key === 'esito' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="pb-3 whitespace-nowrap">Note</th>
                                            <th className="pb-3 pr-4 text-right whitespace-nowrap">Azioni</th>
                                        </tr>
                                    </thead>
"""
content = re.sub(r'<thead>.*?</thead>', th_replacement, content, flags=re.DOTALL)

# 4. Replace KPI Ribbon with new clickable SaaS KPI cards
new_kpi = """
            {/* NEW KPI SAAS CARDS */}
            <div className="bg-slate-50 border-b border-slate-200 py-4 px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-[1600px] mx-auto">
                    {/* Da Contattare */}
                    <div onClick={() => { resetFiltri(); }} className="saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Da Contattare</h3>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.daFare}</p>
                    </div>

                    {/* Contattati */}
                    <div onClick={() => { resetFiltri(); setFContattati(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fContattati && !fAppuntamenti && !fConsFatte ? "ring-2 ring-cyan-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Contattati</h3>
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.contattati}</p>
                    </div>

                    {/* Appuntamenti Fissati */}
                    <div onClick={() => { resetFiltri(); setFAppuntamenti(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppuntamenti && !fConsFatte ? "ring-2 ring-teal-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Appuntamenti</h3>
                            <Calendar className="w-4 h-4 text-teal-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.preso}</p>
                    </div>

                    {/* Consulenze Fatte */}
                    <div onClick={() => { resetFiltri(); setFConsFatte(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fConsFatte ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Consulenze Fatte</h3>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.fatte}</p>
                    </div>

                    {/* Venduti */}
                    <div onClick={() => { resetFiltri(); setFEsiti(["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"]); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fEsiti.includes("ISCRIZIONE") ? "ring-2 ring-indigo-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Venduti</h3>
                            <Check className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-extrabold text-slate-900">{kpi.esiti.filter(e => ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(e.esito)).reduce((a,b) => a+b.cnt, 0)}</p>
                        </div>
                    </div>
                </div>
                
                {/* Abbonamenti Break-down */}
                {kpi.nuoviAbb && kpi.nuoviAbb.length > 0 && (
                    <div className="flex gap-2 justify-center mt-3 max-w-[1600px] mx-auto overflow-x-auto">
                        {kpi.nuoviAbb.map(abb => (
                            <div key={abb.name} onClick={() => { resetFiltri(); setFAbb([abb.name]); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                <span>{abb.name}</span>
                                <span className="bg-white px-1.5 rounded-md shadow-sm text-indigo-900">{abb.cnt}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
"""
# Replace the old KPI RIBBON with the new one.
# The old one is between {/* KPI RIBBON */} and {/* MAIN TABLE AREA */}
content = re.sub(r'\{\/\* KPI RIBBON \*\/\}.*?\{\/\* MAIN TABLE AREA \*\/\}', new_kpi + "\n            {/* MAIN TABLE AREA */}", content, flags=re.DOTALL)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Modification done!")
