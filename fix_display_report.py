import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

old_display = """                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800">{row.nome} {row.cognome}</div>
                                                </td>"""

new_display = """                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-slate-800">{row.cognome} {row.nome}</div>
                                                </td>"""

content = content.replace(old_display, new_display)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Reportistica display updated!")
