import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Let's add a clear filters button right after the Search input in the top bar.
# And maybe a small 'X' inside the search bar if `q` is not empty.
# We have:
old_search_block = """                                <div className="flex-1 sm:max-w-md relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cerca cliente..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                        value={q}
                                        onChange={e => setQ(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    
                                    <button
                                        onClick={() => setShowImport(true)}"""

new_search_block = """                                <div className="flex-1 sm:max-w-md relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-cyan-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Cerca cliente..."
                                        className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                        value={q}
                                        onChange={e => setQ(e.target.value)}
                                    />
                                    {q && (
                                        <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {(fDaContattare || fContattati || fAppuntamenti || fConsFatte || fEsiti.length > 0 || fAbb.length > 0) && (
                                        <button 
                                            onClick={resetFiltri}
                                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
                                        >
                                            <Filter className="w-4 h-4" /> Reset Filtri
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => setShowImport(true)}"""

content = content.replace(old_search_block, new_search_block)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Reset button added!")
