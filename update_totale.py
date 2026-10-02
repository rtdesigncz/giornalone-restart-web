import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Update grid layout and insert Totale card
old_grid = """                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-[1600px] mx-auto">"""
new_grid = """                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-[1600px] mx-auto">
                    {/* Totale */}
                    <div onClick={() => { resetFiltri(); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", (!fDaContattare && !fContattati && !fAppuntamenti && !fConsFatte && fEsiti.length === 0 && fAbb.length === 0) ? "ring-2 ring-slate-400 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Totale</h3>
                            <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.totale}</p>
                    </div>"""

content = content.replace(old_grid, new_grid)

# Now, remove the old collapsible filter button and the area itself.
# Look for the Filter button
filter_button_regex = r'<button\s*onClick=\{\(\) => setShowFilters\(!showFilters\)\}[\s\S]*?<\/button>'
content = re.sub(filter_button_regex, '', content)

# Remove the {showFilters && (...)} block
# It starts at: {/* Collapsible Filters Area */}
show_filters_area_regex = r'\{\/\* Collapsible Filters Area \*\/\}[\s\S]*?resetFiltri\}>[\s\S]*?Reset filtri[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\}'
# Actually regex for nested curly braces is hard. I'll do string replace for the whole block if I can identify it.
with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Totale card added!")
