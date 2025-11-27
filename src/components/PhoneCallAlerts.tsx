// src/components/PhoneCallAlerts.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";

type Consulente = { id: string; nome?: string | null; name?: string | null };

type Entry = {
  id: string;
  entry_date: string;      // YYYY-MM-DD
  entry_time: string|null; // HH:MM:SS
  section: string;
  nome: string|null;
  cognome: string|null;
  telefono: string|null;
  note?: string | null;
  contattato?: boolean|null;
  consulente?: Consulente | null; // join
};

const TELEFONICI = "APPUNTAMENTI TELEFONICI";
const POLL_ENTRIES_MS = 60_000;   // refresh appuntamenti da DB ogni 60s
const TICK_MS = 30_000;           // controllo finestra ogni 30s
// Finestra di preavviso e tolleranza: [-5 minuti, +5 minuti]
const WINDOW_BEFORE_MIN = 5;      // minuti PRIMA dell'orario
const WINDOW_AFTER_MIN  = 5;      // minuti DOPO l'orario

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
};

const toLocalDate = (dateStr: string, timeStr: string|null) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!timeStr) return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  const [hh, mm, ss] = timeStr.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0);
};

const toHHMM = (t?: string|null) => {
  if (!t) return "";
  const [hh, mm] = t.split(":");
  return `${hh}:${mm}`;
};

const sanitizePhone = (raw?: string|null) => {
  if (!raw) return "";
  let n = raw.replace(/[^\d+]/g, "");
  if (!n.startsWith("+")) {
    if (n.startsWith("00")) n = "+" + n.slice(2);
    else n = "+39" + n;
  }
  return n;
};

const consulenteLabel = (c?: Consulente | null) =>
  (c?.nome ?? c?.name ?? "") as string;

// chiave unica che dipende anche dall'ora (così se l'orario cambia, cambia la chiave)
const keyOf = (e: Pick<Entry, "id" | "entry_time">) => `${e.id}|${e.entry_time ?? ""}`;

export default function PhoneCallAlerts() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [due, setDue] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);

  // per evitare ripetizioni su refresh/ri-render
  const dismissedRef = useRef<Set<string>>(new Set()); // chiusi manualmente (senza contattato)
  const firedRef = useRef<Set<string>>(new Set());     // già mostrati in questa sessione

  // chiave LS giornaliera
  const dismissedKey = useMemo(() => `phone-alerts-dismissed-${todayISO()}`, []);

  // carica dismissed (per oggi)
  useEffect(() => {
    const saved = localStorage.getItem(dismissedKey);
    if (saved) {
      try {
        const keys: string[] = JSON.parse(saved);
        dismissedRef.current = new Set(keys);
      } catch {}
    }
  }, [dismissedKey]);

  const persistDismissed = () => {
    localStorage.setItem(dismissedKey, JSON.stringify(Array.from(dismissedRef.current)));
  };

  // fetch periodico: telefonici di oggi, con orario non nullo (join consulente)
  const fetchToday = async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(`
        *,
        consulente:consulenti(*)
      `)
      .eq("section", TELEFONICI)
      .eq("entry_date", todayISO())
      .order("entry_time", { ascending: true });

    if (error) {
      console.error("fetch telefonici error", error);
      return;
    }

    const safe = (data as Entry[]).filter(e => !!e.entry_time);
    setEntries(safe);
  };

  useEffect(() => {
    fetchToday();
    const iv = setInterval(fetchToday, POLL_ENTRIES_MS);
    return () => clearInterval(iv);
  }, []);

  // calcolo appuntamenti “in finestra” (tra t-5min e t+5min), esclusi:
  // - già contattati
  // - già dismissi (per oggi) con la stessa chiave id|entry_time
  // - già mostrati nella sessione (fired) con la stessa chiave
  const computeDue = () => {
    const now = Date.now();
    const beforeMs = WINDOW_BEFORE_MIN * 60_000;
    const afterMs  = WINDOW_AFTER_MIN  * 60_000;

    const eligible = entries.filter(e => {
      if (!e.entry_time) return false;
      if (e.contattato === true) return false;
      const k = keyOf(e);
      if (dismissedRef.current.has(k)) return false;

      const when = toLocalDate(e.entry_date, e.entry_time).getTime();
      // Finestra inclusiva a sinistra ed esclusiva a destra: [t-5min, t+5min)
      const inWindow = now >= (when - beforeMs) && now < (when + afterMs);
      if (!inWindow) return false;

      if (firedRef.current.has(k)) return false;
      return true;
    });

    if (eligible.length > 0) {
      eligible.forEach(e => firedRef.current.add(keyOf(e))); // segnaliamo “mostrato”
      setDue(eligible);
      setOpen(true);
    }
  };

  // tick ogni 30s (e all'avvio / su cambio entries)
  useEffect(() => {
    computeDue();
    const t = setInterval(computeDue, TICK_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // azioni chiusura
  const closeAll = () => {
    // chiudi localmente (senza segnare contattato)
    due.forEach(e => dismissedRef.current.add(keyOf(e)));
    persistDismissed();
    setOpen(false);
    setDue([]);
  };

  const closeOneLocal = (e: Entry) => {
    dismissedRef.current.add(keyOf(e));
    persistDismissed();
    const next = due.filter(x => keyOf(x) !== keyOf(e));
    setDue(next);
    if (next.length === 0) setOpen(false);
  };

  const markOkFatto = async (e: Entry) => {
    // 1) DB: contattato = true
    const { error } = await supabase
      .from("entries")
      .update({ contattato: true })
      .eq("id", e.id);

    if (error) {
      alert("Errore nel segnare come contattato: " + error.message);
      return;
    }

    // 2) avvisa il resto dell'app che questo id è stato segnato contattatoo (UI immediata)
    window.dispatchEvent(new CustomEvent("telefonico:contattato", { detail: { id: e.id } }));

    // 3) chiudi localmente & non farlo più riapparire (stessa chiave)
    closeOneLocal(e);
  };

  // overlay
  if (!open || due.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Promemoria Appuntamenti Telefonici</h3>
          <button className="btn btn-ghost btn-icon" onClick={closeAll} title="Chiudi tutto">
            <X size={18}/>
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
          {due.map((e) => {
            const tel = sanitizePhone(e.telefono);
            const cons = consulenteLabel(e.consulente);
            return (
              <div
                key={keyOf(e)}
                className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    CHIAMARE {e.nome ?? ""} {e.cognome ?? ""} {cons ? <>— <span className="text-slate-700">{cons}</span></> : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    alle ore {toHHMM(e.entry_time)} {tel ? `· ${tel}` : ""}
                  </div>
                  {e.note ? (
                    <div className="text-sm text-slate-600 truncate">
                      Note: {e.note}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {tel && (
                    <>
                      <a className="btn btn-ghost" href={`tel:${tel}`}>
                        Chiama
                      </a>
                      <a
                        className="btn btn-ghost"
                        href={`https://wa.me/${encodeURIComponent(tel)}`}
                        target="_blank"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                  <button className="btn btn-brand" onClick={() => markOkFatto(e)}>
                    OK fatto
                  </button>
                  <button className="btn btn-ghost" onClick={() => closeOneLocal(e)}>
                    Chiudi
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
          <button className="btn btn-ghost" onClick={closeAll}>Chiudi tutto</button>
        </div>
      </div>
    </div>
  );
}