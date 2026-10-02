import re

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "r") as f:
    content = f.read()

calc_logic = '''
  const handleCopy = () => {
    const text = `📊 Report Lista: ${listName || "Senza Nome"}

👥 CONTATTI
- Totale Lista: ${total}
- Da Contattare: ${daContattare}
- Già Contattati: ${contattati}

📅 APPUNTAMENTI
- Consulenze Effettuate: ${consulenzeFatte}
- Appuntamenti in Futuro: ${appuntamentiFuturo}
- Appuntamenti Passati Mancati: ${appuntamentiPassatiMancati}
- Contattati da Fissare: ${daFissare}
(Totale Fissati Storico: ${appuntamentiFissati})

✅ RISULTATI
- Venduti: ${venduti}${abbonamentiBreakdown ? ` (${abbonamentiBreakdown})` : ""}
- In Attesa: ${inAttesa} (${inAttesaFuturo} futuri, ${inAttesaPassatoMancati} scaduti)
- Negativi: ${negativi}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
'''

content = re.sub(r'  const handleCopy = \(\) => \{[\s\S]*?  \};\n', calc_logic, content)

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "w") as f:
    f.write(content)

print("Report text format updated")
