import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Replace the entire KPI row in Reportistica
old_kpi_row = r'<div className="flex flex-wrap items-center gap-3 pb-2">[\s\S]*?<\/div>\n                    <\/div>\n                <\/div>\n            <\/div>'

new_kpi_row = """<div className="flex flex-wrap items-center gap-4 pb-4">
                            {/* Totale */}
                            <div onClick={resetFilters} className={cn("bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all cursor-pointer group shadow-sm hover:shadow-md w-[140px] shrink-0", (selectedEsiti.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.totale}</p>
                            </div>
                            
                            {/* Presentati */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Presentati"); }} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Presentati") ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.presentato}</p>
                            </div>

                            {/* Venduti */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Venduti"); }} className={cn("bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Venduti") ? "ring-2 ring-emerald-600 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-emerald-600" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.venduto}</p>
                            </div>

                            {/* Miss */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Miss"); }} className={cn("bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Miss") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Miss</h3><div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.miss}</p>
                            </div>

                            {/* Assenti */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Assenti"); }} className={cn("bg-white border border-yellow-100 rounded-xl p-5 hover:border-yellow-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Assenti") ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><div className="w-7 h-7 rounded-lg bg-yellow-50 border border-yellow-100 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.assenti}</p>
                            </div>

                            {/* Recuperati */}
                            <div className={cn("bg-cyan-50/50 border border-cyan-100 rounded-xl p-5 transition-all group shadow-sm relative overflow-hidden w-[140px] shrink-0")}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl"></div>
                                <div className="flex items-center justify-between mb-3"><h3 className="text-[11px] font-bold text-cyan-700 uppercase tracking-wide">Recuperati</h3><div className="w-7 h-7 rounded-lg bg-cyan-100/50 border border-cyan-200 flex items-center justify-center"><RefreshCw className="w-3.5 h-3.5 text-cyan-600" /></div></div>
                                <p className="text-3xl font-black text-cyan-900 tracking-tight">{kpis.recuperati || 0}</p>
                            </div>

                            {/* Contattati */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Contattati"); }} className={cn("bg-white border border-blue-100 rounded-xl p-5 hover:border-blue-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Contattati") ? "ring-2 ring-blue-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wide group-hover:text-blue-700">Contattati</h3><div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-blue-500" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.contattato}</p>
                            </div>

                            {/* Negativi */}
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Negativi"); }} className={cn("bg-white border border-red-100 rounded-xl p-5 hover:border-red-300 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden w-[140px] shrink-0", selectedEsiti.includes("Negativi") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                                <div className="flex items-center justify-between mb-3 mt-1"><h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Negativi</h3><div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-600" /></div></div>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.negativo}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>"""

content = re.sub(old_kpi_row, new_kpi_row, content)

# Remove the bg-white rounded-2xl shadow-sm border border-slate-200 around the table so it looks like the preview.
# Actually, the preview has `rounded-xl shadow-sm` for the table. Let's adjust table styles.
old_table_wrapper = r'<div className="max-w-\[1800px\] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">'
new_table_wrapper = '<div className="max-w-[1800px] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">'
content = re.sub(old_table_wrapper, new_table_wrapper, content)

old_table_header = r'<thead className="bg-slate-50\/50 border-b border-slate-100">'
new_table_header = '<thead className="bg-white border-b border-slate-200">'
content = re.sub(old_table_header, new_table_header, content)

old_th_class = r'className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors"'
new_th_class = 'className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-50 transition-colors bg-white border-b border-slate-200"'
content = re.sub(old_th_class, new_th_class, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Reportistica updated!")
