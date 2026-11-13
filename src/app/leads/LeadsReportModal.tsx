"use client";

import { X, PieChart, Calendar, CheckCircle2, Users, Check, Copy, Activity } from "lucide-react";
import { useState } from "react";

type Item = any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  listName: string;
}

export default function LeadsReportModal({ isOpen, onClose, items, listName }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // 1. PANORAMICA
  const totale = items.length;
  const contattati = items.filter(i => i.contattato).length;

  // 2. DA LAVORARE
  const nonContattati = items.filter(i => !i.contattato).length;
  const contattatiSenzaApp = items.filter(i => i.contattato && !i.preso_appuntamento && !i.consulenza_fatta).length;
  const daLavorareTotale = nonContattati + contattatiSenzaApp;

  // 3. APPUNTAMENTI FISSATI
  const appuntamentiFatti = items.filter(i => i.consulenza_fatta).length;
  const daSvolgereItems = items.filter(i => i.preso_appuntamento && !i.consulenza_fatta);
  const appuntamentiDaSvolgere = daSvolgereItems.length;
  const appuntamentiFuturo = daSvolgereItems.filter(i => i.data_consulenza && i.data_consulenza >= today).length;
  const appuntamentiMancati = appuntamentiDaSvolgere - appuntamentiFuturo;
  const appuntamentiFissatiTotale = appuntamentiFatti + appuntamentiDaSvolgere;

  // 4. ESITI
  // IN ATTESA
  const inAttesaItems = items.filter(i => i.esito === "IN ATTESA");
  const inAttesaTotale = inAttesaItems.length;
  const inAttesaFuturo = inAttesaItems.filter(i => i.data_risposta && i.data_risposta >= today).length;
  const inAttesaMancati = inAttesaTotale - inAttesaFuturo;

  // ISCRIZIONI (VENDUTI)
  const iscrittiItems = items.filter(i => i.esito === "ISCRIZIONE");
  const iscrittiTotale = iscrittiItems.length;
  const abbonamentiMap: Record<string, number> = {};
  iscrittiItems.forEach(i => {
    if (i.nuovo_abbonamento_name) {
      const name = i.nuovo_abbonamento_name.toUpperCase();
      abbonamentiMap[name] = (abbonamentiMap[name] || 0) + 1;
    }
  });
  const abbonamentiBreakdown = Object.entries(abbonamentiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${count} ${name}`)
    .join(" - ");

  // NEGATIVI
  const negativiItems = items.filter(i => i.esito === "NEGATIVO");
  const negativi = negativiItems.length;
  const motiviMap: Record<string, number> = {
    "INSODDISFATTO": 0,
    "NON FREQUENTA": 0,
    "TRASFERIMENTO": 0,
    "INFORTUNIO": 0,
  };
  let nonSpecificati = 0;
  negativiItems.forEach(i => {
    const m = (i.motivo_negativo || "").toUpperCase();
    if (m in motiviMap) {
      motiviMap[m]++;
    } else {
      nonSpecificati++;
    }
  });

  const motiviBreakdownText = [
    motiviMap["INSODDISFATTO"] > 0 ? `${motiviMap["INSODDISFATTO"]} Prezzo/Non Convinto` : null,
    motiviMap["NON FREQUENTA"] > 0 ? `${motiviMap["NON FREQUENTA"]} Non frequenta/Tempo` : null,
    motiviMap["TRASFERIMENTO"] > 0 ? `${motiviMap["TRASFERIMENTO"]} Distanza/Trasferimento` : null,
    motiviMap["INFORTUNIO"] > 0 ? `${motiviMap["INFORTUNIO"]} Infortunio/Salute` : null,
    nonSpecificati > 0 ? `${nonSpecificati} Non specificato` : null,
  ].filter(Boolean).join(" - ");

  const tassoChiusura = appuntamentiFatti > 0 ? Math.round((iscrittiTotale / appuntamentiFatti) * 100) : 0;

  const handleCopy = () => {
    const text = `📊 Report Campagna Leads: ${listName || "Senza Nome"}

TOTALE LEADS: ${totale}
CONTATTATI: ${contattati}

DA LAVORARE: ${daLavorareTotale}
- Non contattati: ${nonContattati}
- Contattati senza appuntamento: ${contattatiSenzaApp}

APPUNTAMENTI FISSATI: ${appuntamentiFissatiTotale}
- Consulenze/Tour svolti: ${appuntamentiFatti}
- Appuntamenti da svolgere: ${appuntamentiDaSvolgere} (${appuntamentiFuturo} futuri, ${appuntamentiMancati} passati da riprogrammare)

ESITI LEADS:
- ISCRIZIONI: ${iscrittiTotale}${abbonamentiBreakdown ? ` (${abbonamentiBreakdown})` : ""}
- TASSO CONVERSIONE: ${tassoChiusura}% (su consulenze svolte)
- IN ATTESA: ${inAttesaTotale} (${inAttesaFuturo} con ricontatto futuro, ${inAttesaMancati} senza risposta)
- NEGATIVI: ${negativi}${motiviBreakdownText ? ` (${motiviBreakdownText})` : ""}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#fbfbfb] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 p-2 rounded-xl text-cyan-600">
              <PieChart size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Report Campagna Leads</h2>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{listName || "Nessuna lista"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-cyan-600"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copiato!" : "Copia Report"}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Totale Leads</span>
              <span className="text-2xl font-black text-slate-800">{totale}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">Contattati</span>
              <span className="text-2xl font-black text-blue-600">{contattati}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Iscrizioni</span>
              <span className="text-2xl font-black text-emerald-600">{iscrittiTotale}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider block">Tasso Chiusura</span>
              <span className="text-2xl font-black text-cyan-600">{tassoChiusura}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* DA LAVORARE */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Da Lavorare ({daLavorareTotale})</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Non ancora contattati:</span>
                  <span className="font-bold text-slate-700">{nonContattati}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Contattati senza appuntamento:</span>
                  <span className="font-bold text-slate-700">{contattatiSenzaApp}</span>
                </div>
              </div>
            </div>

            {/* APPUNTAMENTI */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-teal-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Funnel Appuntamenti ({appuntamentiFissatiTotale})</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Consulenze / Tour svolti:</span>
                  <span className="font-bold text-teal-600">{appuntamentiFatti}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">In programma (futuri):</span>
                  <span className="font-bold text-slate-700">{appuntamentiFuturo}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Passati da riprogrammare:</span>
                  <span className="font-bold text-rose-600">{appuntamentiMancati}</span>
                </div>
              </div>
            </div>

            {/* ESITI */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-cyan-600" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Esiti Leads</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Iscrizioni */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Iscrizioni Chiuse ({iscrittiTotale})</span>
                  <p className="text-xs text-slate-600">{abbonamentiBreakdown || "Nessuna iscrizione registrata"}</p>
                </div>

                {/* In Attesa */}
                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">In Attesa ({inAttesaTotale})</span>
                  <p className="text-xs text-slate-600">{inAttesaFuturo} con data ricontatto futura, {inAttesaMancati} in attesa aperta</p>
                </div>

                {/* Negativi */}
                <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-lg">
                  <span className="text-[11px] font-bold text-rose-800 uppercase block mb-1">Negativi ({negativi})</span>
                  <p className="text-xs text-slate-600">{motiviBreakdownText || "Nessun negativo"}</p>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
