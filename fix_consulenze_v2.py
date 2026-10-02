import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Add imports
content = content.replace(
    'import ImportCsvModal from "./ImportCsvModal";',
    'import ImportCsvModal from "./ImportCsvModal";\nimport ConsulenzeReportModal from "./ConsulenzeReportModal";\nimport { PieChart } from "lucide-react";'
)

# Add state
state_hook = r'  const \[abbOptions, setAbbOptions\] = useState<string\[\]>\(\[\]\);'
content = re.sub(state_hook, state_hook.replace('\\', '') + '\n  const [reportOpen, setReportOpen] = useState(false);', content)

# Add button
btn_target_code = '''                                    <button
                                        onClick={aggiungiRiga}
                                        className="btn btn-brand whitespace-nowrap"
                                    >'''
new_btn = '''                                    <button 
                                        className="btn btn-outline gap-2 bg-white text-[#21b5ba] border-[#21b5ba] hover:bg-[#21b5ba] hover:text-white transition-all disabled:opacity-50 whitespace-nowrap"
                                        onClick={() => setReportOpen(true)}
                                        disabled={!gestioneId || items.length === 0}
                                        title="Vedi Report Lista"
                                    >
                                        <PieChart className="w-4 h-4" />
                                        <span className="hidden sm:inline">Report</span>
                                    </button>
                                    <button
                                        onClick={aggiungiRiga}
                                        className="btn btn-brand whitespace-nowrap"
                                    >'''

content = content.replace(btn_target_code, new_btn)

# Add Modal
modal_target = r'{/* MODALS */}'
new_modal = '''{/* MODALS */}
            <ConsulenzeReportModal 
                isOpen={reportOpen} 
                onClose={() => setReportOpen(false)} 
                items={items} 
                listName={gestioni.find(g => g.id === gestioneId)?.nome || ""} 
            />'''

content = content.replace(modal_target, new_modal)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("ConsulenzeClientV2 patched")
