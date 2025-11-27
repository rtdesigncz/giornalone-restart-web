// src/app/consulenze/ConsulenzeClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Pencil, Check, X, Trash2, Upload } from "lucide-react";
import ImportCsvModal from "./ImportCsvModal";

type Gestione = { id: string; nome: string; descrizione?: string | null; csv_mapping_default?: any };

type Item = {
  id: string;
  gestione_id: string;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  scadenza: string | null; // YYYY-MM-DD
  tipo_abbonamento_corrente: string | null;

  contattato: boolean | null;
  preso_appuntamento: boolean | null;
  consulenza_fatta: boolean | null;

  data_consulenza: string | null; // YYYY-MM-DD
  esito: "ISCRIZIONE" | "RINNOVO" | "INTEGRAZIONE" | "IN ATTESA" | "NEGATIVO" | null;
  nuovo_abbonamento_name: string | null;
  data_risposta: string | null; // YYYY-MM-DD

  note: string | null;

  _isDraft?: boolean;
  _editing?: boolean;
  _backup?: Partial<Item>;
};

const ESITI = ["ISCRIZIONE","RINNOVO","INTEGRAZIONE","IN ATTESA","NEGATIVO"] as const;

const ReadOnlyCell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[32px] whitespace-pre-wrap break-words leading-snug text-[12px] py-0.5">
    {children || <span className="text-slate-400">—</span>}
  </div>
);

export default function ConsulenzeClient() {
  const [gestioni, setGestioni] = useState<Gestione[]>([]);
  const [gestioneId, setGestioneId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [abbOptions, setAbbOptions] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [fContattati, setFContattati] = useState(false);
  const [fAppuntamenti, setFAppuntamenti] = useState(false);
  const [fConsFatte, setFConsFatte] = useState(false);
  const [fEsiti, setFEsiti] = useState<string[]>([]);
  const [fAbb, setFAbb] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);

  const resetFiltri = () => {
    setQ(""); setFContattati(false); setFAppuntamenti(false);
    setFConsFatte(false); setFEsiti([]); setFAbb([]);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/consulenze/gestioni");
      const j = await res.json();
      setGestioni(j.rows || []);
      if (!gestioneId && j.rows?.[0]?.id) setGestioneId(j.rows[0].id);
    })().catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/consulenze/options/abbonamenti");
      const j = await res.json();
      setAbbOptions(j.options || []);
    })().catch(() => {});
  }, []);

  const reloadItems = async (gid: string) => {
    setLoading(true);
    setErr("");
    try {
      const ri = await fetch(`/api/consulenze/items?gestione=${gid}`);
      if (!ri.ok) throw new Error("Errore caricamento righe");
      const ji = await ri.json();
      const loaded: Item[] = (ji.rows || []).map((r: Item) => ({ ...r, _editing: false }));
      setItems(loaded);
    } catch (e:any) {
      setErr(String(e?.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (gestioneId) reloadItems(gestioneId);
  }, [gestioneId]);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((r) => {
      if (qq) {
        const s = `${r.nome||""} ${r.cognome||""} ${r.telefono||""}`.toLowerCase();
        if (!s.includes(qq)) return false;
      }
      if (fContattati && !r.contattato) return false;
      if (fAppuntamenti && !r.preso_appuntamento) return false;
      if (fConsFatte && !r.consulenza_fatta) return false;
      if (fEsiti.length && (!r.esito || !fEsiti.includes(r.esito))) return false;
      if (fAbb.length && (!r.nuovo_abbonamento_name || !fAbb.includes(r.nuovo_abbonamento_name))) return false;
      return true;
    });
  }, [items, q, fContattati, fAppuntamenti, fConsFatte, fEsiti, fAbb]);

  const kpi = useMemo(() => {
    const totale = items.length;
    const contattati = items.filter(r => !!r.contattato).length;
    const preso = items.filter(r => !!r.preso_appuntamento).length;
    const fatte = items.filter(r => !!r.consulenza_fatta).length;
    const daFare = items.filter(r => !r.consulenza_fatta).length;
    const esiti = ESITI.map(e => ({ esito: e, cnt: items.filter(r => r.esito === e).length }));
    const abbMap = new Map<string, number>();
    for (const r of items) {
      const n = r.nuovo_abbonamento_name?.trim();
      if (!n) continue;
      abbMap.set(n, (abbMap.get(n) || 0) + 1);
    }
    const nuoviAbb = Array.from(abbMap.entries()).map(([name, cnt]) => ({ name, cnt }));
    return { totale, contattati, preso, fatte, daFare, esiti, nuoviAbb };
  }, [items]);

  const toggleStrIn = (arr:string[], set:(v:string[])=>void, val:string)=>{
    if(arr.includes(val)) set(arr.filter(x=>x!==val)); else set([...arr, val]);
  };
  const rowBgForEsito = (e: Item["esito"]) => {
    if (e === "IN ATTESA") return "bg-yellow-50";
    if (e === "NEGATIVO") return "bg-red-50";
    if (e === "ISCRIZIONE" || e === "RINNOVO" || e === "INTEGRAZIONE") return "bg-green-50";
    return "";
  };
  const cxBox = "h-5 w-5 align-middle";

  const creaGestione = async () => {
    const nome = window.prompt("Nome della gestione?");
    if (!nome) return;
    const res = await fetch("/api/consulenze/gestioni", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ nome })
    });
    if (res.ok) {
      const j = await res.json();
      setGestioni((g)=>[...g, j.row]);
      setGestioneId(j.row.id);
    } else alert("Errore creazione gestione");
  };
  const rinominaGestione = async () => {
    if (!gestioneId) return;
    const nome = window.prompt("Nuovo nome gestione?");
    if (!nome) return;
    const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, {
      method:"PATCH", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ nome })
    });
    if (res.ok) setGestioni((g)=>g.map(x=>x.id===gestioneId?{...x, nome}:x));
    else alert("Errore rinomina gestione");
  };
  const eliminaGestione = async () => {
    if (!gestioneId) return;
    if (!confirm("Eliminare questa gestione e tutte le righe?")) return;
    const res = await fetch(`/api/consulenze/gestioni?id=${gestioneId}`, { method:"DELETE" });
    if (res.ok) {
      const next = gestioni.filter(x=>x.id!==gestioneId);
      setGestioni(next);
      setGestioneId(next[0]?.id || "");
      setItems([]);
    } else alert("Errore eliminazione gestione");
  };

  const persistFullRow = async (r: Item) => {
    const body = {
      nome: r.nome ?? null,
      cognome: r.cognome ?? null,
      telefono: r.telefono ?? null,
      scadenza: r.scadenza || null,
      tipo_abbonamento_corrente: r.tipo_abbonamento_corrente || null,
      contattato: !!r.contattato,
      preso_appuntamento: !!r.preso_appuntamento,
      consulenza_fatta: !!r.consulenza_fatta,
      data_consulenza: r.data_consulenza || null,
      esito: r.esito || null,
      nuovo_abbonamento_name: r.nuovo_abbonamento_name || null,
      data_risposta: r.data_risposta || null,
      note: r.note || null,
    };
    const res = await fetch(`/api/consulenze/items?id=${r.id}`, {
      method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Errore salvataggio riga");
  };

  const eliminaRiga = async (id:string) => {
    const r = items.find(x=>x.id===id);
    if (r?._isDraft) { setItems(it=>it.filter(x=>x.id!==id)); return; }
    if (!confirm("Eliminare la riga?")) return;
    const res = await fetch(`/api/consulenze/items?id=${id}`, { method:"DELETE" });
    if (res.ok) setItems(it=>it.filter(r=>r.id!==id));
    else alert("Errore eliminazione riga");
  };

  const aggiungiRiga = () => {
    if (!gestioneId) { alert("Seleziona una gestione"); return; }
    const tmp: Item = {
      id: `tmp-${Date.now()}`,
      gestione_id: gestioneId,
      nome: "", cognome: "", telefono: "",
      scadenza: "", tipo_abbonamento_corrente: "",
      contattato: false, preso_appuntamento: false, consulenza_fatta: false,
      data_consulenza: "", esito: null, nuovo_abbonamento_name: null, data_risposta: "",
      note: "",
      _isDraft: true, _editing: true,
    };
    setItems((it)=>[tmp, ...it]);
  };

  const salvaBozza = async (id:string) => {
    const r = items.find(x=>x.id===id);
    if (!r) return;
    const body = {
      gestione_id: r.gestione_id,
      nome: r.nome ?? null, cognome: r.cognome ?? null, telefono: r.telefono ?? null,
      scadenza: r.scadenza || null, tipo_abbonamento_corrente: r.tipo_abbonamento_corrente || null,
      contattato: !!r.contattato, preso_appuntamento: !!r.preso_appuntamento, consulenza_fatta: !!r.consulenza_fatta,
      data_consulenza: r.data_consulenza || null, esito: r.esito || null,
      nuovo_abbonamento_name: r.nuovo_abbonamento_name || null, data_risposta: r.data_risposta || null,
      note: r.note || null,
    };
    const res = await fetch(`/api/consulenze/items`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body)
    });
    if (!res.ok) { alert("Errore salvataggio riga"); return; }
    const j = await res.json();
    setItems(it=>it.map(x=>x.id===id ? { ...j.row, _editing: false } : x));
  };
  const annullaBozza = (id:string) => setItems(it=>it.filter(x=>x.id!==id));

  const entraInModifica = (id:string) => {
    setItems(it => it.map(x => {
      if (x.id !== id) return x;
      const backup: Partial<Item> = {
        nome: x.nome, cognome: x.cognome, telefono: x.telefono,
        scadenza: x.scadenza, tipo_abbonamento_corrente: x.tipo_abbonamento_corrente,
        contattato: x.contattato, preso_appuntamento: x.preso_appuntamento, consulenza_fatta: x.consulenza_fatta,
        data_consulenza: x.data_consulenza, esito: x.esito, nuovo_abbonamento_name: x.nuovo_abbonamento_name,
        data_risposta: x.data_risposta, note: x.note
      };
      return { ...x, _editing: true, _backup: backup };
    }));
  };
  const salvaModifica = async (id:string) => {
    const r = items.find(x=>x.id===id);
    if (!r) return;
    try {
      await persistFullRow(r);
      setItems(it => it.map(x => x.id===id ? { ...x, _editing: false, _backup: undefined } : x));
    } catch {
      alert("Errore salvataggio riga");
    }
  };
  const annullaModifica = (id:string) => {
    const r = items.find(x=>x.id===id);
    if (!r) return;
    const b = r._backup || {};
    setItems(it => it.map(x => x.id===id ? { ...x, ...b, _editing: false, _backup: undefined } : x));
  };

  const editable = (r: Item) => !!(r._isDraft || r._editing);
  const isConsFatta = (r:Item) => !!r.consulenza_fatta;
  const abilitaNuovoAbb = (r:Item) => r.esito && ["ISCRIZIONE","RINNOVO","INTEGRAZIONE"].includes(r.esito);
  const abilitaDataRisposta = (r:Item) => r.esito === "IN ATTESA";

  return (
    <div className="space-y-6">
      {/* Import Modal */}
      {showImport && (
        <ImportCsvModal
          gestioneId={gestioneId}
          onClose={() => setShowImport(false)}
          onImported={() => { reloadItems(gestioneId); }}
        />
      )}

      {/* Barra gestione + azioni */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Gestione</label>
          <select
            className="input"
            value={gestioneId}
            onChange={(e)=>setGestioneId(e.target.value)}
          >
            {gestioni.map(g=>(
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={creaGestione}>+ Nuova gestione</button>
          <button className="btn btn-ghost" onClick={rinominaGestione} disabled={!gestioneId}>Rinomina</button>
          <button className="btn btn-ghost" onClick={eliminaGestione} disabled={!gestioneId}>Elimina</button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Totale clienti</div>
          <div className="text-xl font-semibold">{kpi.totale}</div>
        </div>
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Contattati</div>
          <div className="text-xl font-semibold">{kpi.contattati}</div>
        </div>
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Preso appuntamento</div>
          <div className="text-xl font-semibold">{kpi.preso}</div>
        </div>
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Consulenza fatta</div>
          <div className="text-xl font-semibold">{kpi.fatte}</div>
        </div>
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Consulenza da fare</div>
          <div className="text-xl font-semibold">{kpi.daFare}</div>
        </div>
        <div className="p-3 border rounded-lg bg-white">
          <div className="text-xs text-slate-500">Esiti (tot)</div>
          <div className="text-xl font-semibold">{kpi.esiti.reduce((a,b)=>a + (b.cnt||0),0)}</div>
        </div>
      </div>

      {/* Report sotto KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="font-medium mb-2">Esiti</div>
          <div className="flex flex-wrap gap-2">
            {kpi.esiti.map(e => (
              <span key={e.esito} className="tag">{e.esito}: {e.cnt}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="font-medium mb-2">Nuovi abbonamenti</div>
          <div className="flex flex-wrap gap-2">
            {kpi.nuoviAbb.length ? kpi.nuoviAbb.map(a => (
              <span key={a.name} className="tag">{a.name}: {a.cnt}</span>
            )) : <span className="text-slate-500 text-sm">Nessun dato</span>}
          </div>
        </div>
      </div>

      {/* Filtri ordinati */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1"
            placeholder="Cerca nome, cognome o telefono…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <button className="btn btn-ghost" onClick={resetFiltri}>Azzera filtri</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">Stato</div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className={cxBox} checked={fContattati} onChange={e=>setFContattati(e.target.checked)} />
                <span>Contattati</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className={cxBox} checked={fAppuntamenti} onChange={e=>setFAppuntamenti(e.target.checked)} />
                <span>Appuntamenti</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className={cxBox} checked={fConsFatte} onChange={e=>setFConsFatte(e.target.checked)} />
                <span>Consulenze fatte</span>
              </label>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Esito</div>
            <div className="flex flex-wrap gap-2">
              {ESITI.map(e => (
                <label key={e} className="inline-flex items-center gap-2 border rounded px-2 py-1">
                  <input
                    type="checkbox"
                    className={cxBox}
                    checked={fEsiti.includes(e)}
                    onChange={()=>toggleStrIn(fEsiti,setFEsiti,e)}
                  />
                  <span className="text-sm">{e}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Nuovo abbonamento</div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-auto pr-1">
              {abbOptions.map(n => (
                <label key={n} className="inline-flex items-center gap-2 border rounded px-2 py-1">
                  <input
                    type="checkbox"
                    className={cxBox}
                    checked={fAbb.includes(n)}
                    onChange={()=>toggleStrIn(fAbb,setFAbb,n)}
                  />
                  <span className="text-sm">{n}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex justify-between">
        <div className="text-slate-500 text-sm">{rows.length} risultati</div>
        <div className="flex gap-2">
          <button className="btn" onClick={aggiungiRiga}>+ Aggiungi</button>
          <button className="btn" onClick={()=>setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importa CSV
          </button>
        </div>
      </div>

      {/* Tabella con header sticky intra-wrapper */}
      <div className="rounded-xl border bg-white shadow-sm">
        {err && <div className="p-3 text-red-600">{err}</div>}
        {loading ? (
          <div className="p-3 text-slate-500">Caricamento…</div>
        ) : (
          <div className="p-0">
            {/* Wrapper scrollabile: lo sticky si ancora qui */}
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-white">
                  <tr className="text-left text-slate-600">
                    {[
                      ["NOME","w-24"],["COGNOME","w-24"],["SCADENZA","w-24"],["TIPO ABB.","w-28"],
                      ["TELEFONO","w-28"],["CONT.","w-14 text-center"],["APP.","w-14 text-center"],["CONS.","w-14 text-center"],
                      ["DATA CONS.","w-28"],["ESITO","w-32"],["NUOVO ABB.","w-40"],["DATA RISP.","w-28"],["NOTE","w-48"],["Azioni","w-28"]
                    ].map(([label, extra], i) => (
                      <th
                        key={i}
                        className={`py-2 px-2 ${extra} sticky top-0 z-30 bg-white border-b shadow-[0_1px_0_0_rgba(0,0,0,0.06)]`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map(r => {
                    const editableNow = !!(r._isDraft || r._editing);
                    const consFatta = !!r.consulenza_fatta;
                    const abilAbb = r.esito && ["ISCRIZIONE","RINNOVO","INTEGRAZIONE"].includes(r.esito);
                    const abilRisposta = r.esito === "IN ATTESA";
                    const draft = !!r._isDraft;

                    const inputCls = "input w-full text-[12px] py-1";
                    const rowBg = rowBgForEsito(r.esito);

                    return (
                      <tr key={r.id} className={`border-t align-top ${rowBg}`}>
                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input className={inputCls}
                              value={r.nome||""}
                              onChange={e=>setItems(it=>it.map(x=>x.id===r.id?{...x,nome:e.target.value}:x))}
                            />
                          ) : (
                            <ReadOnlyCell>{r.nome}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input className={inputCls}
                              value={r.cognome||""}
                              onChange={e=>setItems(it=>it.map(x=>x.id===r.id?{...x,cognome:e.target.value}:x))}
                            />
                          ) : (
                            <ReadOnlyCell>{r.cognome}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input type="date" className={inputCls}
                              value={r.scadenza||""}
                              onChange={e=>{const v=e.target.value; setItems(it=>it.map(x=>x.id===r.id?{...x,scadenza:v}:x));}}
                            />
                          ) : (
                            <ReadOnlyCell>{r.scadenza}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input className={inputCls}
                              value={r.tipo_abbonamento_corrente||""}
                              onChange={e=>setItems(it=>it.map(x=>x.id===r.id?{...x,tipo_abbonamento_corrente:e.target.value}:x))}
                            />
                          ) : (
                            <ReadOnlyCell>{r.tipo_abbonamento_corrente}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input className={inputCls}
                              value={r.telefono||""}
                              onChange={e=>setItems(it=>it.map(x=>x.id===r.id?{...x,telefono:e.target.value}:x))}
                            />
                          ) : (
                            <ReadOnlyCell>{r.telefono}</ReadOnlyCell>
                          )}
                        </td>

                        {/* Checkbox */}
                        <td className="py-1.5 px-2 text-center">
                          <input type="checkbox" className="h-5 w-5 align-middle" disabled={!editableNow}
                            checked={!!r.contattato}
                            onChange={e=>{const v=e.target.checked; setItems(it=>it.map(x=>x.id===r.id?{...x,contattato:v}:x));}}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input type="checkbox" className="h-5 w-5 align-middle" disabled={!editableNow}
                            checked={!!r.preso_appuntamento}
                            onChange={e=>{const v=e.target.checked; setItems(it=>it.map(x=>x.id===r.id?{...x,preso_appuntamento:v}:x));}}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input type="checkbox" className="h-5 w-5 align-middle" disabled={!editableNow}
                            checked={!!r.consulenza_fatta}
                            onChange={e=>{
                              const v = e.target.checked;
                              const patch:any = { consulenza_fatta:v };
                              if (!v) { patch.data_consulenza = ""; patch.esito = null; patch.nuovo_abbonamento_name = null; patch.data_risposta = ""; }
                              setItems(it=>it.map(x=>x.id===r.id?{...x,...patch}:x));
                            }}
                          />
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input type="date" className={inputCls}
                              disabled={!consFatta}
                              value={r.data_consulenza||""}
                              onChange={e=>{const v=e.target.value; setItems(it=>it.map(x=>x.id===r.id?{...x,data_consulenza:v}:x));}}
                            />
                          ) : (
                            <ReadOnlyCell>{r.data_consulenza}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <select className={inputCls}
                              disabled={!consFatta}
                              value={r.esito||""}
                              onChange={e=>{
                                const v = (e.target.value || null) as Item["esito"];
                                const patch:any = { esito: v };
                                if (!v || !["ISCRIZIONE","RINNOVO","INTEGRAZIONE"].includes(v)) patch.nuovo_abbonamento_name = null;
                                if (v !== "IN ATTESA") patch.data_risposta = "";
                                setItems(it=>it.map(x=>x.id===r.id?{...x,...patch}:x));
                              }}
                            >
                              <option value="">—</option>
                              {ESITI.map(e=><option key={e} value={e}>{e}</option>)}
                            </select>
                          ) : (
                            <ReadOnlyCell>{r.esito}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <select className={inputCls}
                              disabled={!consFatta || !abilAbb}
                              value={r.nuovo_abbonamento_name||""}
                              onChange={e=>{const v=e.target.value||null; setItems(it=>it.map(x=>x.id===r.id?{...x,nuovo_abbonamento_name:v}:x));}}
                            >
                              <option value=""></option>
                              {abbOptions.map(n=><option key={n} value={n}>{n}</option>)}
                            </select>
                          ) : (
                            <ReadOnlyCell>{r.nuovo_abbonamento_name}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <input type="date" className={inputCls}
                              disabled={!consFatta || !abilRisposta}
                              value={r.data_risposta||""}
                              onChange={e=>{const v=e.target.value; setItems(it=>it.map(x=>x.id===r.id?{...x,data_risposta:v}:x));}}
                            />
                          ) : (
                            <ReadOnlyCell>{r.data_risposta}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          {editableNow ? (
                            <textarea className={inputCls + " min-h-[32px]"}
                              value={r.note||""}
                              onChange={e=>setItems(it=>it.map(x=>x.id===r.id?{...x,note:e.target.value}:x))}
                            />
                          ) : (
                            <ReadOnlyCell>{r.note}</ReadOnlyCell>
                          )}
                        </td>

                        <td className="py-1.5 px-2">
                          <div className="flex gap-2">
                            {draft ? (
                              <>
                                <button className="btn" title="Salva" onClick={()=>salvaBozza(r.id)}>
                                  <Check className="w-4 h-4" />
                                </button>
                                <button className="btn btn-ghost" title="Annulla" onClick={()=>annullaBozza(r.id)}>
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : r._editing ? (
                              <>
                                <button className="btn" title="Salva modifiche" onClick={()=>salvaModifica(r.id)}>
                                  <Check className="w-4 h-4" />
                                </button>
                                <button className="btn btn-ghost" title="Annulla modifiche" onClick={()=>annullaModifica(r.id)}>
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                {r.telefono ? (
                                  <a className="btn btn-ghost"
                                    href={`https://wa.me/${encodeURIComponent(r.telefono)}`}
                                    target="_blank" rel="noreferrer" title="WhatsApp">
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                ) : null}
                                <button className="btn btn-ghost" title="Modifica" onClick={()=>entraInModifica(r.id)}>
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="btn btn-ghost" title="Elimina" onClick={()=>eliminaRiga(r.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={14} className="py-6 text-center text-slate-500">Nessuna riga</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}