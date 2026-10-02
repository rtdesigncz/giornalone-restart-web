import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Replace KPI cards
old_kpi_row = r'<div className="flex flex-wrap items-center gap-3 pb-2 w-full">[\s\S]*?<\/div>\n                <\/div>\n            <\/div>'

new_kpi_row = """<div className="flex flex-wrap items-center gap-4 pb-4 w-full">
                            {/* Totale */}
                            <div onClick={() => setSelectedEsiti([])} className={cn("bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all cursor-pointer group shadow-sm hover:shadow-md w-[140px] shrink-0", selectedEsiti.length === 0 ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-slate-400" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.totale}</p>
                            </div>
                            
                            {/* Presentati */}
                            <div onClick={() => toggleSelection(selectedEsiti, setSelectedEsiti, "Presentati")} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Presentati") ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.presentato}</p>
                            </div>

                            {/* Venduti */}
                            <div onClick={() => toggleSelection(selectedEsiti, setSelectedEsiti, "Venduti")} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Venduti") ? "ring-2 ring-emerald-600 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-600" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.venduto}</p>
                            </div>

                            {/* Miss */}
                            <div onClick={() => toggleSelection(selectedEsiti, setSelectedEsiti, "Miss")} className={cn("bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Miss") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Miss</h3><div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.miss}</p>
                            </div>

                            {/* Assenti */}
                            <div onClick={() => toggleSelection(selectedEsiti, setSelectedEsiti, "Assenti")} className={cn("bg-white border border-yellow-100 rounded-xl p-5 hover:border-yellow-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Assenti") ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><div className="w-7 h-7 rounded-lg bg-yellow-50 border border-yellow-100 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.assenti}</p>
                            </div>

                            {/* In Attesa (Replacing Recuperati logic here for Consulenze) */}
                            <div onClick={() => toggleSelection(selectedEsiti, setSelectedEsiti, "IN ATTESA")} className={cn("bg-white border border-orange-100 rounded-xl p-5 hover:border-orange-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("IN ATTESA") ? "ring-2 ring-orange-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-orange-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-orange-600 uppercase tracking-wide group-hover:text-orange-700">In Attesa</h3><div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-orange-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.inAttesa || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>"""

content = re.sub(old_kpi_row, new_kpi_row, content)

# Table layout
old_table_wrapper = r'<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">'
new_table_wrapper = '<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">'
content = re.sub(old_table_wrapper, new_table_wrapper, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze updated!")
