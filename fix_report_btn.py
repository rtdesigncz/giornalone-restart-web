import re

with open("src/app/consulenze/ConsulenzeClient.tsx", "r") as f:
    content = f.read()

target = r'<button className="btn" onClick={aggiungiRiga}>+ Aggiungi</button>'

new_btns = '''<button 
            className="btn btn-brand bg-[#21b5ba] text-white hover:bg-[#1da1a6] border-none shadow-md" 
            onClick={() => setReportOpen(true)}
            disabled={!gestioneId || items.length === 0}
            title="Apri Report di questa Lista"
          >
            <PieChart className="w-4 h-4 mr-2" /> Report Lista
          </button>
          <button className="btn" onClick={aggiungiRiga}>+ Aggiungi</button>'''

content = content.replace(target, new_btns)

with open("src/app/consulenze/ConsulenzeClient.tsx", "w") as f:
    f.write(content)

print("Button successfully injected!")
