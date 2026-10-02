import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Add KPI calculation
old_kpi = r'const appuntamentiDaFare = items\.filter\(r => !!r\.preso_appuntamento && !r\.consulenza_fatta\)\.length;'
new_kpi = """const appuntamentiDaFissare = items.filter(r => !!r.contattato && !r.preso_appuntamento).length;
        const appuntamentiDaFare = items.filter(r => !!r.preso_appuntamento && !r.consulenza_fatta).length;"""
content = re.sub(old_kpi, new_kpi, content)

# 2. Add to return
old_return = r'return \{ totale, contattati, appuntamentiDaFare, fatte, daFare, esiti, nuoviAbb \};'
new_return = 'return { totale, contattati, appuntamentiDaFissare, appuntamentiDaFare, fatte, daFare, esiti, nuoviAbb };'
content = re.sub(old_return, new_return, content)

# 3. Add state
old_state = r'const \[fAppDaFare, setFAppDaFare\] = useState\(false\);'
new_state = """const [fAppDaFissare, setFAppDaFissare] = useState(false);
    const [fAppDaFare, setFAppDaFare] = useState(false);"""
content = re.sub(old_state, new_state, content)

# 4. Add filter condition
old_filter = r'if \(fAppDaFare && \(!r\.preso_appuntamento \|\| r\.consulenza_fatta\)\) return false;'
new_filter = """if (fAppDaFissare && (!r.contattato || r.preso_appuntamento)) return false;
            if (fAppDaFare && (!r.preso_appuntamento || r.consulenza_fatta)) return false;"""
content = re.sub(old_filter, new_filter, content)

# 5. Add to dependency array
old_dep = r'\[items, q, fContattati, fDaContattare, fAppDaFare, fConsFatte, fEsiti, fAbb\]'
new_dep = '[items, q, fContattati, fDaContattare, fAppDaFissare, fAppDaFare, fConsFatte, fEsiti, fAbb]'
content = re.sub(old_dep, new_dep, content)

# 6. Add to resetFiltri
old_reset = r'setFContattati\(false\); setFDaContattare\(false\); setFAppDaFare\(false\);'
new_reset = 'setFContattati(false); setFDaContattare(false); setFAppDaFissare(false); setFAppDaFare(false);'
content = re.sub(old_reset, new_reset, content)

# 7. Update layout from 6 to 7 columns
old_grid = r'<div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-\[1600px\] mx-auto">'
new_grid = '<div className="grid grid-cols-2 md:grid-cols-7 gap-4 max-w-[1600px] mx-auto">'
content = re.sub(old_grid, new_grid, content)

# 8. Add the new card and rename the old one
old_ui = r'\{\/\* Appuntamenti Da Fare \*\/\}\s*<div onClick=\{.*?\bsetFAppDaFare\(true\).*?\} className=\{cn\("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFare \? "ring-2 ring-teal-500 border-transparent" : ""\)\}>\s*<div className="flex items-center justify-between mb-1">\s*<h3 className="text-\[12px\] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Appunt\. Da Fare</h3>\s*<Calendar className="w-4 h-4 text-teal-500" />\s*</div>\s*<p className="text-2xl font-extrabold text-slate-900">\{kpi\.appuntamentiDaFare\}</p>\s*</div>'

new_ui = """{/* Da Fissare */}
                    <div onClick={() => { resetFiltri(); setFAppDaFissare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFissare ? "ring-2 ring-orange-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Da Fissare</h3>
                            <Phone className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.appuntamentiDaFissare}</p>
                    </div>

                    {/* Fissati (Da Svolgere) */}
                    <div onClick={() => { resetFiltri(); setFAppDaFare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFare ? "ring-2 ring-teal-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Fissati</h3>
                            <Calendar className="w-4 h-4 text-teal-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.appuntamentiDaFare}</p>
                    </div>"""

content = re.sub(old_ui, new_ui, content)

# 9. Update the filter highlight conditions for other cards
old_tot_ring = r'\(!fDaContattare && !fContattati && !fAppDaFare && !fConsFatte'
new_tot_ring = '(!fDaContattare && !fContattati && !fAppDaFissare && !fAppDaFare && !fConsFatte'
content = re.sub(old_tot_ring, new_tot_ring, content)

old_contattati_ring = r'fContattati && !fAppDaFare && !fConsFatte \?'
new_contattati_ring = 'fContattati && !fAppDaFissare && !fAppDaFare && !fConsFatte ?'
content = re.sub(old_contattati_ring, new_contattati_ring, content)

old_reset_cond = r'\(fDaContattare \|\| fContattati \|\| fAppDaFare \|\| fConsFatte'
new_reset_cond = '(fDaContattare || fContattati || fAppDaFissare || fAppDaFare || fConsFatte'
content = re.sub(old_reset_cond, new_reset_cond, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze 7-KPI grid updated!")
