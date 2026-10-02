import re

with open("src/app/consulenze/ConsulenzeClient.tsx", "r") as f:
    content = f.read()

# Add import
content = content.replace(
    'import ImportCsvModal from "./ImportCsvModal";',
    'import ImportCsvModal from "./ImportCsvModal";\nimport ConsulenzeReportModal from "./ConsulenzeReportModal";\nimport { PieChart } from "lucide-react";'
)

# Add state
state_hook = r'  const \[abbOptions, setAbbOptions\] = useState<string\[\]>\(\[\]\);'
content = re.sub(state_hook, state_hook.replace('\\', '') + '\n  const [reportOpen, setReportOpen] = useState(false);', content)

# Add button
btn_target_code = '<button className="btn btn-brand gap-2" onClick={handleAggiungiRiga} disabled={!gestioneId}>'
new_btn = '''<button 
                className="btn btn-outline gap-2 bg-white text-brand border-brand hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                onClick={() => setReportOpen(true)}
                disabled={!gestioneId || items.length === 0}
                title="Vedi Report Lista"
              >
                <PieChart size={16} />
                <span className="hidden sm:inline">Report</span>
              </button>
              ''' + btn_target_code

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

with open("src/app/consulenze/ConsulenzeClient.tsx", "w") as f:
    f.write(content)

print("ConsulenzeClient patched")
