import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Update kpi calculation
old_kpi = r'const preso = items\.filter\(r => !!r\.contattato && !!r\.preso_appuntamento\)\.length;'
new_kpi = 'const appuntamentiDaFare = items.filter(r => !!r.preso_appuntamento && !r.consulenza_fatta).length;'
content = re.sub(old_kpi, new_kpi, content)

# 2. Add filter state
old_state = r'const \[fAppuntamenti, setFAppuntamenti\] = useState\(false\);'
new_state = 'const [fAppDaFare, setFAppDaFare] = useState(false);'
content = re.sub(old_state, new_state, content)

# 3. Update filter logic
old_filter_logic = r'if \(fAppuntamenti && !r\.preso_appuntamento\) return false;'
new_filter_logic = 'if (fAppDaFare && (!r.preso_appuntamento || r.consulenza_fatta)) return false;'
content = re.sub(old_filter_logic, new_filter_logic, content)

# 4. Update reset filters
old_reset = r'setFAppuntamenti\(false\);'
new_reset = 'setFAppDaFare(false);'
content = re.sub(old_reset, new_reset, content)

# 5. Update KPI UI
old_ui = r'\{\/\* Appuntamenti Fissati \*\/\}\s*<div onClick=\{.*?\bsetFAppuntamenti\(true\).*?\} className=\{cn\("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppuntamenti && !fConsFatte \? "ring-2 ring-teal-500 border-transparent" : ""\)\}>\s*<div className="flex items-center justify-between mb-1">\s*<h3 className="text-\[12px\] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Appuntamenti</h3>\s*<Calendar className="w-4 h-4 text-teal-500" />\s*</div>\s*<p className="text-2xl font-extrabold text-slate-900">\{kpi\.preso\}</p>\s*</div>'

new_ui = """{/* Appuntamenti Da Fare */}
                    <div onClick={() => { resetFiltri(); setFAppDaFare(true); }} className={cn("saas-panel p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group", fAppDaFare ? "ring-2 ring-teal-500 border-transparent" : "")}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700">Appunt. Da Fare</h3>
                            <Calendar className="w-4 h-4 text-teal-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{kpi.appuntamentiDaFare}</p>
                    </div>"""

content = re.sub(old_ui, new_ui, content)

# Also update the Totale box where it checks the states for the ring:
old_tot_ring = r'\(!fDaContattare && !fContattati && !fAppuntamenti && !fConsFatte'
new_tot_ring = '(!fDaContattare && !fContattati && !fAppDaFare && !fConsFatte'
content = re.sub(old_tot_ring, new_tot_ring, content)

# Also update the "Contattati" box where it checks for fAppuntamenti:
old_contattati_ring = r'fContattati && !fAppuntamenti && !fConsFatte \?'
new_contattati_ring = 'fContattati && !fAppDaFare && !fConsFatte ?'
content = re.sub(old_contattati_ring, new_contattati_ring, content)

# Also update the Filter Reset button condition
old_reset_cond = r'\(fDaContattare \|\| fContattati \|\| fAppuntamenti \|\| fConsFatte'
new_reset_cond = '(fDaContattare || fContattati || fAppDaFare || fConsFatte'
content = re.sub(old_reset_cond, new_reset_cond, content)


with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Consulenze KPI updated!")
