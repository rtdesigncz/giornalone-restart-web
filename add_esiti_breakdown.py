import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

old_breakdown = """                {/* Abbonamenti Break-down */}
                {kpi.nuoviAbb && kpi.nuoviAbb.length > 0 && (
                    <div className="flex gap-2 justify-center mt-3 max-w-[1600px] mx-auto overflow-x-auto">
                        {kpi.nuoviAbb.map(abb => (
                            <div key={abb.name} onClick={() => { resetFiltri(); setFAbb([abb.name]); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                <span>{abb.name}</span>
                                <span className="bg-white px-1.5 rounded-md shadow-sm text-indigo-900">{abb.cnt}</span>
                            </div>
                        ))}
                    </div>
                )}"""

new_breakdown = """                {/* Esiti & Abbonamenti Break-down */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4 max-w-[1600px] mx-auto overflow-x-auto pb-1">
                    {/* Esiti Breakdown */}
                    <div className="flex gap-2 flex-wrap justify-center">
                        {kpi.esiti.map(e => {
                            let colorClass = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                            let badgeClass = "text-slate-900";
                            if (e.esito === "ISCRIZIONE") { colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"; badgeClass = "text-emerald-900"; }
                            if (e.esito === "RINNOVO") { colorClass = "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"; badgeClass = "text-teal-900"; }
                            if (e.esito === "INTEGRAZIONE") { colorClass = "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"; badgeClass = "text-cyan-900"; }
                            if (e.esito === "IN ATTESA") { colorClass = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"; badgeClass = "text-amber-900"; }
                            if (e.esito === "NEGATIVO") { colorClass = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"; badgeClass = "text-red-900"; }

                            return (
                                <div key={e.esito} onClick={() => { resetFiltri(); setFEsiti([e.esito]); }} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-colors", colorClass)}>
                                    <span>{e.esito}</span>
                                    <span className={cn("bg-white px-1.5 rounded-md shadow-sm", badgeClass)}>{e.cnt}</span>
                                </div>
                            );
                        })}
                    </div>
                    
                    {kpi.nuoviAbb && kpi.nuoviAbb.length > 0 && (
                        <>
                            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                {kpi.nuoviAbb.map(abb => (
                                    <div key={abb.name} onClick={() => { resetFiltri(); setFAbb([abb.name]); }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                                        <span>{abb.name}</span>
                                        <span className="bg-white px-1.5 rounded-md shadow-sm text-indigo-900">{abb.cnt}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>"""

content = content.replace(old_breakdown, new_breakdown)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Esiti breakdown added!")
