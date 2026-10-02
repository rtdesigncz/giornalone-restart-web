import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# 1. Replace boolean states with selectedEsiti array
old_states = """    const [fPresentato, setFPresentato] = useState(false);
    const [fVenduto, setFVenduto] = useState(false);
    const [fMiss, setFMiss] = useState(false);
    const [fContattato, setFContattato] = useState(false);
    const [fNegativo, setFNegativo] = useState(false);
    const [fAssente, setFAssente] = useState(false);
    const [fRecuperati, setFRecuperati] = useState(false); // New filter for recovered"""

new_states = """    const [selectedEsiti, setSelectedEsiti] = useState<string[]>([]);"""

content = content.replace(old_states, new_states)

# 2. Update resetFilters
old_reset = """        setFPresentato(false);
        setFVenduto(false);
        setFMiss(false);
        setFContattato(false);
        setFNegativo(false);
        setFAssente(false);
        setFRecuperati(false);"""

new_reset = """        setSelectedEsiti([]);"""

content = content.replace(old_reset, new_reset)

# 3. Update useEffect dependencies
old_deps = """        fPresentato, fVenduto, fMiss, fContattato, fNegativo, fAssente
    ]);"""
new_deps = """        selectedEsiti
    ]);"""
content = content.replace(old_deps, new_deps)

# 4. Update filteredRows logic
old_filter_logic = """        if (fPresentato) r = r.filter(row => row.presentato);
        if (fVenduto) r = r.filter(row => row.venduto);
        if (fMiss) r = r.filter(row => row.miss);
        if (fAssente) r = r.filter(row => row.assente);
        if (fContattato) r = r.filter(row => row.contattato);
        if (fNegativo) r = r.filter(row => row.negativo);
        if (fRecuperati) r = r.filter(row => !!row.conversion);"""

new_filter_logic = """        if (selectedEsiti.length > 0) {
            r = r.filter(row => {
                let match = false;
                if (selectedEsiti.includes("Presentati") && row.presentato) match = true;
                if (selectedEsiti.includes("Venduti") && row.venduto) match = true;
                if (selectedEsiti.includes("Miss") && row.miss) match = true;
                if (selectedEsiti.includes("Assenti") && row.assente) match = true;
                if (selectedEsiti.includes("Recuperati") && !!row.conversion) match = true;
                if (selectedEsiti.includes("Contattati") && row.contattato) match = true;
                if (selectedEsiti.includes("Negativi") && row.negativo) match = true;
                return match;
            });
        }"""

content = content.replace(old_filter_logic, new_filter_logic)

# Also update dependency array for filteredRows
content = content.replace("resp, searchTerm, fRecuperati", "resp, searchTerm, selectedEsiti")

# 5. Add DropdownFilter and Reset Button condition
old_dropdown_area = """                                <DropdownFilter 
                                    label="Abbonamenti" 
                                    options={resp?.meta.options.tipi_abbonamento || []} 
                                    selected={selectedTipi} 
                                    toggle={(v: string) => toggleSelection(selectedTipi, setSelectedTipi, v)} 
                                    clear={() => setSelectedTipi([])} 
                                />

                                {(searchTerm || selectedSezioni.length > 0 || selectedConsulenti.length > 0 || selectedTipi.length > 0 || fPresentato || fVenduto || fMiss || fAssente || fRecuperati || fContattato || fNegativo) && ("""

new_dropdown_area = """                                <DropdownFilter 
                                    label="Abbonamenti" 
                                    options={resp?.meta.options.tipi_abbonamento || []} 
                                    selected={selectedTipi} 
                                    toggle={(v: string) => toggleSelection(selectedTipi, setSelectedTipi, v)} 
                                    clear={() => setSelectedTipi([])} 
                                />
                                <DropdownFilter 
                                    label="Esito" 
                                    options={["Presentati", "Venduti", "Miss", "Assenti", "Recuperati", "Contattati", "Negativi"]} 
                                    selected={selectedEsiti} 
                                    toggle={(v: string) => toggleSelection(selectedEsiti, setSelectedEsiti, v)} 
                                    clear={() => setSelectedEsiti([])} 
                                />

                                {(searchTerm || selectedSezioni.length > 0 || selectedConsulenti.length > 0 || selectedTipi.length > 0 || selectedEsiti.length > 0) && ("""

content = content.replace(old_dropdown_area, new_dropdown_area)

# 6. Update KPI Cards to use selectedEsiti
old_kpi_cards = """                        {/* Row 2: KPI Cards (Clickable) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-[1800px] mx-auto pb-2">
                            <div onClick={resetFilters} className={cn("saas-panel p-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", (!fPresentato && !fVenduto && !fMiss && !fAssente && !fRecuperati && !fContattato && !fNegativo) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><BarChart3 className="w-4 h-4 text-slate-400" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.totale}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFPresentato(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group", fPresentato ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><Check className="w-4 h-4 text-emerald-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.presentato}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFVenduto(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group", fVenduto ? "ring-2 ring-emerald-600 border-transparent bg-emerald-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><Check className="w-4 h-4 text-emerald-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.venduto}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFMiss(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group", fMiss ? "ring-2 ring-orange-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-orange-600 uppercase tracking-wide group-hover:text-orange-700">Miss</h3><AlertCircle className="w-4 h-4 text-orange-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.miss}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFAssente(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all group", fAssente ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><AlertCircle className="w-4 h-4 text-yellow-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.assenti}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFRecuperati(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-cyan-300 hover:shadow-md transition-all group", fRecuperati ? "ring-2 ring-cyan-500 border-transparent bg-cyan-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide group-hover:text-cyan-800">Recuperati</h3><RefreshCw className="w-4 h-4 text-cyan-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.recuperati || 0}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFContattato(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group", fContattato ? "ring-2 ring-blue-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wide group-hover:text-blue-700">Contattati</h3><Check className="w-4 h-4 text-blue-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.contattato}</p>
                            </div>
                            <div onClick={() => { resetFilters(); setFNegativo(true); }} className={cn("saas-panel p-3 cursor-pointer hover:border-red-300 hover:shadow-md transition-all group", fNegativo ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Negativi</h3><X className="w-4 h-4 text-red-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.negativo}</p>
                            </div>
                        </div>"""

new_kpi_cards = """                        {/* Row 2: KPI Cards (Clickable) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-[1800px] mx-auto pb-2">
                            <div onClick={resetFilters} className={cn("saas-panel p-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", (selectedEsiti.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><BarChart3 className="w-4 h-4 text-slate-400" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.totale}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Presentati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group", selectedEsiti.includes("Presentati") ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><Check className="w-4 h-4 text-emerald-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.presentato}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Venduti"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group", selectedEsiti.includes("Venduti") ? "ring-2 ring-emerald-600 border-transparent bg-emerald-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><Check className="w-4 h-4 text-emerald-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.venduto}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Miss"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group", selectedEsiti.includes("Miss") ? "ring-2 ring-orange-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-orange-600 uppercase tracking-wide group-hover:text-orange-700">Miss</h3><AlertCircle className="w-4 h-4 text-orange-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.miss}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Assenti"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all group", selectedEsiti.includes("Assenti") ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><AlertCircle className="w-4 h-4 text-yellow-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.assenti}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Recuperati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-cyan-300 hover:shadow-md transition-all group", selectedEsiti.includes("Recuperati") ? "ring-2 ring-cyan-500 border-transparent bg-cyan-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide group-hover:text-cyan-800">Recuperati</h3><RefreshCw className="w-4 h-4 text-cyan-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.recuperati || 0}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Contattati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group", selectedEsiti.includes("Contattati") ? "ring-2 ring-blue-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wide group-hover:text-blue-700">Contattati</h3><Check className="w-4 h-4 text-blue-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.contattato}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Negativi"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-red-300 hover:shadow-md transition-all group", selectedEsiti.includes("Negativi") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Negativi</h3><X className="w-4 h-4 text-red-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.negativo}</p>
                            </div>
                        </div>"""

content = content.replace(old_kpi_cards, new_kpi_cards)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Esiti dropdown added and logic combined!")
