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

export default function ConsulenzeReportModal({ isOpen, onClose, items, listName }: Props) {
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

  // VENDUTI
  const vendutiItems = items.filter(i => ["ISCRIZIONE", "RINNOVO", "INTEGRAZIONE"].includes(i.esito));
  const vendutiTotale = vendutiItems.length;
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

  // NEGATIVI
  const negativi = items.filter(i => i.esito === "NEGATIVO").length;

  const handleCopy = () => {
    const text = `📊 Report Lista: ${listName || "Senza Nome"}

TOTALE: ${totale}
CONTATTATI: ${contattati}

DA LAVORARE: ${daLavorareTotale}
- Non contattati: ${nonContattati}
- Contattati senza appuntamento: ${contattatiSenzaApp}

APPUNTAMENTI FISSATI: ${appuntamentiFissatiTotale}
- Appuntamenti fatti: ${appuntamentiFatti}
- Appuntamenti da svolgere: ${appuntamentiDaSvolgere} (${appuntamentiFuturo} da oggi in poi, ${appuntamentiMancati} mancati)

IN ATTESA: ${inAttesaTotale} (${inAttesaFuturo} da oggi in poi, ${inAttesaMancati} mancati)
VENDUTI: ${vendutiTotale}${abbonamentiBreakdown ? ` (${abbonamentiBreakdown})` : ""}
NEGATIVI: ${negativi}`;

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
            <div className="bg-brand/10 p-2 rounded-xl text-brand">
              <PieChart size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Report Status Consulenze</h2>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{listName || "Nessuna lista"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-brand"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copiato!" : "Copia Testo"}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 max-h-[85vh] overflow-y-auto">
          
          {/* Left Column: Contatti e Appuntamenti */}
          <div className="space-y-6">
            
            {/* Panoramica */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{totale}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Totale</span>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-blue-700">{contattati}</span>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-1">Contattati</span>
              </div>
            </div>

            {/* DA LAVORARE */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Activity size={14} /> Da Lavorare
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                <div className="p-3 border-b border-slate-100 bg-orange-50/30 flex justify-between items-center">
                  <span className="font-bold text-orange-800">Totale Da Lavorare</span>
                  <span className="font-black text-lg text-orange-700">{daLavorareTotale}</span>
                </div>
                <div className="flex justify-between p-3 border-b border-slate-100 items-center">
                  <span className="font-semibold text-slate-600">Non Contattati</span>
                  <span className="font-bold text-slate-700">{nonContattati}</span>
                </div>
                <div className="flex justify-between p-3 items-center">
                  <span className="font-semibold text-slate-600">Contattati senza appuntamento</span>
                  <span className="font-bold text-slate-700">{contattatiSenzaApp}</span>
                </div>
              </div>
            </div>

            {/* APPUNTAMENTI FISSATI */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar size={14} /> Appuntamenti Fissati
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
                <div className="p-3 border-b border-slate-100 bg-brand/5 flex justify-between items-center">
                  <span className="font-bold text-brand">Totale Appuntamenti</span>
                  <span className="font-black text-lg text-brand">{appuntamentiFissatiTotale}</span>
                </div>
                <div className="flex justify-between p-3 border-b border-slate-100 items-center">
                  <span className="font-semibold text-slate-700">Appuntamenti Fatti</span>
                  <span className="font-bold text-emerald-600 text-base">{appuntamentiFatti}</span>
                </div>
                
                <div className="p-3 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">Da Svolgere</span>
                    <span className="font-bold text-slate-800 text-base">{appuntamentiDaSvolgere}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-white border border-slate-200 rounded p-1.5 flex justify-between items-center">
                      <span className="text-slate-500">Da oggi in poi</span>
                      <span className="font-bold">{appuntamentiFuturo}</span>
                    </div>
                    <div className="flex-1 bg-white border border-rose-100 rounded p-1.5 flex justify-between items-center text-rose-700">
                      <span>Mancati</span>
                      <span className="font-bold">{appuntamentiMancati}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Esiti */}
          <div className="space-y-6">
            
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Esiti
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm flex flex-col h-full">
                
                {/* Venduti */}
                <div className="p-4 border-b border-slate-100 bg-emerald-50/50">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-emerald-700 text-lg uppercase tracking-wide">Venduti</span>
                    <span className="font-black text-emerald-600 text-3xl">{vendutiTotale}</span>
                  </div>
                  {abbonamentiBreakdown && (
                    <div className="mt-2 text-xs font-semibold text-emerald-700/70 bg-emerald-100/50 rounded-lg p-2 text-center">
                      {abbonamentiBreakdown}
                    </div>
                  )}
                </div>

                {/* In Attesa */}
                <div className="p-4 border-b border-slate-100 bg-amber-50/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-amber-700 text-base uppercase tracking-wide">In Attesa</span>
                    <span className="font-black text-amber-600 text-2xl">{inAttesaTotale}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-white border border-slate-200 rounded p-1.5 flex justify-between items-center">
                      <span className="text-slate-500">Da oggi in poi</span>
                      <span className="font-bold">{inAttesaFuturo}</span>
                    </div>
                    <div className="flex-1 bg-white border border-rose-100 rounded p-1.5 flex justify-between items-center text-rose-700">
                      <span>Mancati</span>
                      <span className="font-bold">{inAttesaMancati}</span>
                    </div>
                  </div>
                </div>

                {/* Negativi */}
                <div className="p-4 bg-rose-50/30 flex justify-between items-center">
                  <span className="font-bold text-rose-700 text-base uppercase tracking-wide">Negativi</span>
                  <span className="font-black text-rose-600 text-2xl">{negativi}</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
