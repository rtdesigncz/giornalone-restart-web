import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Add null safety to sorting
old_sort_logic = """                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;"""

new_sort_logic = """                if (aValue === null || aValue === undefined) aValue = "";
                if (bValue === null || bValue === undefined) bValue = "";
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;"""

content = content.replace(old_sort_logic, new_sort_logic)

# Add visual indicators to table headers
old_headers = """                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('entry_date')}>Data / Ora</th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('section')}>Sezione</th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('nome')}>Cliente</th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('telefono')}>Telefono</th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('consulente')}>Cons. / Abb.</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Esito</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center bg-cyan-50/30 text-cyan-700">Conversione</th>
                                    </tr>"""

new_headers = """                                    <tr>
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
                                            Telefono {sortConfig?.key === 'telefono' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none group" onClick={() => handleSort('consulente')}>
                                            Cons. / Abb. {sortConfig?.key === 'consulente' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-cyan-600" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-cyan-600" />) : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30" />}
                                        </th>
                                        <th className="px-6 py-4 whitespace-nowrap">Esito</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-center bg-cyan-50/30 text-cyan-700">Conversione</th>
                                    </tr>"""

content = content.replace(old_headers, new_headers)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Sorting visual feedback added and logic fixed!")
