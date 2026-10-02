import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

old_badge = r'<td className="px-6 py-3 text-center bg-cyan-50/10 group-hover:bg-cyan-50/20 transition-colors">[\s\S]*?<\/td>'

new_badge = """<td className="px-6 py-3 text-center bg-cyan-50/10 group-hover:bg-cyan-50/20 transition-colors">
                                                    {row.isRecuperato ? (
                                                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-cyan-100 text-cyan-700 border border-cyan-200" title="Questo venduto deriva da un contatto precedente">
                                                                <RefreshCw className="w-3 h-3" />
                                                                RECUPERATO
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200 text-xs">-</span>
                                                    )}
                                                </td>"""

content = re.sub(old_badge, new_badge, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Badge updated!")
