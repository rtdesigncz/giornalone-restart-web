import re

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "r") as f:
    content = f.read()

# Add imports for useState and Copy/Check icons
import_old = 'import { X, PieChart, Calendar, CheckCircle2, Users } from "lucide-react";'
import_new = 'import { X, PieChart, Calendar, CheckCircle2, Users, Copy, Check } from "lucide-react";\nimport { useState } from "react";'
content = content.replace(import_old, import_new)

# Add state inside component
state_old = '  if (!isOpen) return null;'
state_new = '  const [copied, setCopied] = useState(false);\n\n  if (!isOpen) return null;'
content = content.replace(state_old, state_new)

# Generate copy text logic
calc_anchor = '  const negativi = items.filter(i => i.esito === "NEGATIVO").length;'
copy_logic = '''
  const handleCopy = () => {
    const text = `📊 Report Lista: ${listName || "Senza Nome"}

👥 CONTATTI
- Totale Lista: ${total}
- Da Contattare: ${daContattare}
- Già Contattati: ${contattati}

📅 APPUNTAMENTI
- Appuntamenti Fissati: ${appuntamentiFissati} (${appuntamentiFuturo} in futuro, ${appuntamentiPassatiMancati} passato mancati)
- Consulenze Effettuate: ${consulenzeFatte}
- Ancora da Fissare: ${daFissare}

✅ RISULTATI
- Venduti: ${venduti}${abbonamentiBreakdown ? ` (${abbonamentiBreakdown})` : ""}
- In Attesa: ${inAttesa} (${inAttesaFuturo} in futuro, ${inAttesaPassatoMancati} passato mancati)
- Negativi: ${negativi}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
'''
content = content.replace(calc_anchor, calc_anchor + copy_logic)

# Add button to Header
header_old = '''          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>'''

header_new = '''          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-brand"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copiato!" : "Copia Riepilogo"}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>'''

content = content.replace(header_old, header_new)

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "w") as f:
    f.write(content)

print("Copy feature added!")
