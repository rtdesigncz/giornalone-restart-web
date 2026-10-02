import re

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "r") as f:
    content = f.read()

new_logic = '''  if (!isOpen) return null;

  // Safe local timezone date
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // 1. CONTATTI
  const total = items.length;
  const daContattare = items.filter(i => !i.contattato).length;
  const contattati = items.filter(i => i.contattato).length;
  
  // 2. FUNNEL
  const consulenzeFatte = items.filter(i => i.consulenza_fatta).length;
  
  // "Appuntamenti Fissati" explicitly means "Appuntamenti DA FARE" (booked but not done)
  const appuntamentiDaFareItems = items.filter(i => i.preso_appuntamento && !i.consulenza_fatta);
  const appuntamentiDaFare = appuntamentiDaFareItems.length;
  
  const appuntamentiFuturo = appuntamentiDaFareItems.filter(i => i.data_consulenza && i.data_consulenza >= today).length;
  const appuntamentiPassatiMancati = appuntamentiDaFare - appuntamentiFuturo; // Tutto ciò che non è futuro, è mancato/scaduto
  
  // Da Fissare = Contattato, ma senza appuntamento e senza consulenza fatta
  const daFissare = items.filter(i => i.contattato && !i.preso_appuntamento && !i.consulenza_fatta).length;

  // 3. RISULTATI
  const vendutiItems = items.filter(i => ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(i.esito));
  const venduti = vendutiItems.length;
  
  const abbonamentiMap: Record<string, number> = {};
  vendutiItems.forEach(i => {
    if (i.nuovo_abbonamento_name) {
      const name = i.nuovo_abbonamento_name.toUpperCase();
      abbonamentiMap[name] = (abbonamentiMap[name] || 0) + 1;
    }
  });
  const abbonamentiBreakdown = Object.entries(abbonamentiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${count} ${name}`)
    .join(" - ");

  const inAttesaItems = items.filter(i => i.esito === "IN ATTESA");
  const inAttesa = inAttesaItems.length;
  const inAttesaFuturo = inAttesaItems.filter(i => i.data_risposta && i.data_risposta >= today).length;
  const inAttesaPassatoMancati = inAttesa - inAttesaFuturo; // Tutto ciò che non è futuro, è mancato/scaduto

  const negativi = items.filter(i => i.esito === "NEGATIVO").length;

  const handleCopy = () => {
    const text = `📊 Report Lista: ${listName || "Senza Nome"}

👥 CONTATTI
- Totale Lista: ${total}
- Da Contattare: ${daContattare}
- Già Contattati: ${contattati}

📅 APPUNTAMENTI
- Consulenze Effettuate: ${consulenzeFatte}
- Appuntamenti Fissati: ${appuntamentiDaFare} (${appuntamentiFuturo} in futuro, ${appuntamentiPassatiMancati} passato mancati)
- Da Fissare: ${daFissare}

✅ RISULTATI
- Venduti: ${venduti}${abbonamentiBreakdown ? ` (${abbonamentiBreakdown})` : ""}
- In Attesa: ${inAttesa} (${inAttesaFuturo} in futuro, ${inAttesaPassatoMancati} passato mancati)
- Negativi: ${negativi}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };'''

# Replace logic block
content = re.sub(r'  if \(!isOpen\) return null;[\s\S]*?  const handleCopy = \(\) => \{[\s\S]*?  \};\n', new_logic + '\n', content)

# Update JSX bindings inside the return
content = content.replace('{appuntamentiFissati}', '{appuntamentiDaFare}')
content = content.replace('Fissati (Totale)', 'Fissati (Da Fare)')

with open("src/app/consulenze/ConsulenzeReportModal.tsx", "w") as f:
    f.write(content)

print("Math logic completely fixed!")
