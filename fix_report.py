import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# 1. Clean up buildParams
old_params = """        if (selectedEsiti) {
            // this is wrong, I'll just rewrite the params block
"""
# I'll use regex to rewrite the buildParams function completely.
build_params_regex = r'    const buildParams = \(\) => \{[\s\S]*?return p;\n    \};'
new_build_params = """    const buildParams = () => {
        const p = new URLSearchParams();
        p.set("format", "json");
        if (modePeriodo === "giorno") p.set("date", date);
        else {
            p.set("from", from);
            p.set("to", to);
        }

        if (selectedSezioni.length > 0) p.append("section", selectedSezioni.join(","));
        if (selectedConsulenti.length > 0) p.append("consulente", selectedConsulenti.join(","));
        if (selectedTipi.length > 0) p.append("tipo_abbonamento", selectedTipi.join(","));

        // Esiti are fetched directly without API filters for these flags in the original code,
        // wait, the original code had:
        // if (fPresentato) p.append("presentato", "true");
        // We can just omit them to fetch all and filter client-side, 
        // OR we can pass them. It's safer to fetch all and filter client-side since that's what we do.
        // Actually the original code did:
        if (selectedEsiti.includes("Presentati")) p.append("presentato", "true");
        if (selectedEsiti.includes("Venduti")) p.append("venduto", "true");
        if (selectedEsiti.includes("Miss")) p.append("miss", "true");
        if (selectedEsiti.includes("Contattati")) p.append("contattato", "true");
        if (selectedEsiti.includes("Negativi")) p.append("negativo", "true");
        if (selectedEsiti.includes("Assenti")) p.append("assente", "true");
        
        return p;
    };"""

content = re.sub(build_params_regex, new_build_params, content)

# 2. Find where Row 2 starts and MAIN TABLE AREA starts
# I will replace everything from `{/* Row 2: KPI Cards */}` down to `{/* MAIN TABLE AREA */}`
dirty_area_regex = r'\{\/\* Row 2: KPI Cards \*\/\}[\s\S]*?\{\/\* MAIN TABLE AREA \*\/\}'

clean_kpi_area = """{/* Row 2: KPI Cards (Clickable) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-[1800px] mx-auto pb-2 mt-4">
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
                        </div>
                    </div>
                </div>

            {/* MAIN TABLE AREA */}"""

content = re.sub(dirty_area_regex, clean_kpi_area, content)

# 3. Clean up useMemo dependency array just in case
content = content.replace("resp, searchTerm, fPresentato, fVenduto, fMiss, fContattato, fNegativo, fAssente", "resp, searchTerm, selectedEsiti")

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Reportistica cleaned up successfully!")
