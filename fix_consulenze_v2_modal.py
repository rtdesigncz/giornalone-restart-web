import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Add Modal
modal_target = r'{/* ACTION MODALS */}'
new_modal = '''{/* ACTION MODALS */}
            <ConsulenzeReportModal 
                isOpen={reportOpen} 
                onClose={() => setReportOpen(false)} 
                items={items} 
                listName={gestioni.find(g => g.id === gestioneId)?.nome || ""} 
            />'''

content = content.replace(modal_target, new_modal)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("ConsulenzeClientV2 modal injected")
