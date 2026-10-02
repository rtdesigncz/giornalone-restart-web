import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

thead_regex = r'<thead className="bg-slate-50/50 border-b border-slate-100">[\s\S]*?<\/thead>'

new_thead = """<thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('entry_date')}>
                                            Data / Ora {sortConfig?.key === 'entry_date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('section')}>
                                            Sezione {sortConfig?.key === 'section' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('nome')}>
                                            Cliente {sortConfig?.key === 'nome' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('telefono')}>
                                            Contatti {sortConfig?.key === 'telefono' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('consulente')}>
                                            Dettagli {sortConfig?.key === 'consulente' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center">Esito</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center bg-cyan-50/30 text-cyan-700">Conversione</th>
                                    </tr>
                                </thead>"""

content = re.sub(thead_regex, new_thead, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Headers replaced!")
