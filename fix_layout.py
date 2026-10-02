import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# I will replace the whole header area from `<div className="flex flex-col gap-4">` down to `</div> </div> </div> {/* MAIN TABLE AREA */}`

old_header_start = r'<div className="flex flex-col gap-4">[\s\S]*?\{\/\* MAIN TABLE AREA \*\/\}'

new_header = """<div className="flex flex-col gap-4">
                        {/* Row 1: Title + Date + PDF */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-slate-900 hidden sm:block">Reportistica</h1>
                                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                {/* Date Controls */}
                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setModePeriodo("giorno")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                            modePeriodo === "giorno" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Giorno
                                    </button>
                                    <button
                                        onClick={() => setModePeriodo("periodo")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                                            modePeriodo === "periodo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Periodo
                                    </button>
                                </div>

                                {modePeriodo === "giorno" ? (
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="input py-1.5 h-9 text-sm bg-white border-slate-200 w-auto font-medium text-slate-700"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5 h-9 shadow-sm">
                                        <input
                                            type="date"
                                            value={from}
                                            onChange={(e) => setFrom(e.target.value)}
                                            className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent font-medium"
                                        />
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <input
                                            type="date"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            className="text-sm border-none focus:ring-0 p-0 text-slate-700 w-28 bg-transparent font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={pdfHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 h-10 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Scarica PDF</span>
                                </a>
                            </div>
                        </div>

                        {/* Row 2: Filters */}
                        <div className="flex flex-wrap items-center gap-2 w-full">
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cerca cliente..."
                                    className="w-full pl-9 pr-8 py-2 h-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            <DropdownFilter 
                                label="Sezioni" 
                                options={resp?.meta.options.sezioni || DB_SECTIONS} 
                                selected={selectedSezioni} 
                                toggle={(v: string) => toggleSelection(selectedSezioni, setSelectedSezioni, v)} 
                                clear={() => setSelectedSezioni([])} 
                                formatLabel={getSectionLabel}
                            />
                            <DropdownFilter 
                                label="Consulenti" 
                                options={resp?.meta.options.consulenti || []} 
                                selected={selectedConsulenti} 
                                toggle={(v: string) => toggleSelection(selectedConsulenti, setSelectedConsulenti, v)} 
                                clear={() => setSelectedConsulenti([])} 
                            />
                            <DropdownFilter 
                                label="Abbonamenti" 
                                options={resp?.meta.options.tipi_abbonamento || []} 
                                selected={selectedTipi} 
                                toggle={(v: string) => toggleSelection(selectedTipi, setSelectedTipi, v)} 
                                clear={() => setSelectedTipi([])} 
                            />
                            <DropdownFilter 
                                label="Esito" 
                                options={["Presentati", "Venduti", "Miss", "Assenti", "Contattati", "Negativi"]} 
                                selected={selectedEsiti} 
                                toggle={(v: string) => toggleSelection(selectedEsiti, setSelectedEsiti, v)} 
                                clear={() => setSelectedEsiti([])} 
                            />

                            {(searchTerm || selectedSezioni.length > 0 || selectedConsulenti.length > 0 || selectedTipi.length > 0 || selectedEsiti.length > 0) && (
                                <button onClick={resetFilters} className="hidden sm:flex items-center gap-2 px-3 py-2 h-10 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors">
                                    <Filter className="w-4 h-4" /> Reset
                                </button>
                            )}
                        </div>

                        {/* Row 3: KPI Cards (Clickable) */}
                        <div className="flex flex-wrap items-center gap-3 pb-2">
                            <div onClick={resetFilters} className={cn("saas-panel p-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group w-[135px] shrink-0", (selectedEsiti.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3><BarChart3 className="w-4 h-4 text-slate-400" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.totale}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Presentati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Presentati") ? "ring-2 ring-emerald-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide group-hover:text-emerald-700">Presentati</h3><Check className="w-4 h-4 text-emerald-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.presentato}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Venduti"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Venduti") ? "ring-2 ring-emerald-600 border-transparent bg-emerald-50" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide group-hover:text-emerald-800">Venduti</h3><Check className="w-4 h-4 text-emerald-600" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.venduto}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Miss"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Miss") ? "ring-2 ring-orange-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-orange-600 uppercase tracking-wide group-hover:text-orange-700">Miss</h3><AlertCircle className="w-4 h-4 text-orange-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.miss}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Assenti"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Assenti") ? "ring-2 ring-yellow-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide group-hover:text-yellow-700">Assenti</h3><AlertCircle className="w-4 h-4 text-yellow-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.assenti}</p>
                            </div>
                            <div className={cn("saas-panel p-3 border-cyan-100 bg-cyan-50/30 group w-[135px] shrink-0")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide">Recuperati</h3><RefreshCw className="w-4 h-4 text-cyan-500" /></div>
                                <p className="text-xl font-extrabold text-cyan-900">{kpis.recuperati || 0}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Contattati"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Contattati") ? "ring-2 ring-blue-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wide group-hover:text-blue-700">Contattati</h3><Check className="w-4 h-4 text-blue-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.contattato}</p>
                            </div>
                            <div onClick={() => { toggleSelection(selectedEsiti, setSelectedEsiti, "Negativi"); }} className={cn("saas-panel p-3 cursor-pointer hover:border-red-300 hover:shadow-md transition-all group w-[135px] shrink-0", selectedEsiti.includes("Negativi") ? "ring-2 ring-red-500 border-transparent" : "")}>
                                <div className="flex items-center justify-between mb-1"><h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wide group-hover:text-red-700">Negativi</h3><X className="w-4 h-4 text-red-500" /></div>
                                <p className="text-xl font-extrabold text-slate-900">{kpis.negativo}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN TABLE AREA */}"""

content = re.sub(old_header_start, new_header, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Layout updated!")
