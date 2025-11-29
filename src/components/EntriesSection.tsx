import { SalePopup, ReschedulePopup, VerifyPopup, AbsentPopup } from "./outcomes/OutcomePopups";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getLocalDateISO } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabaseClient";
import SectionTableShell from "./SectionTableShell";
import { MessageCircle, Phone, Pencil, Trash2, Check, X, Copy } from "lucide-react";
import EntryCard from "./EntryCard";
import { useOutcomeManager } from "@/hooks/useOutcomeManager";
import OutcomeButtons from "./outcomes/OutcomeButtons";
import EntryDrawer from "./agenda/EntryDrawer";

// ... imports ...



type AnyObj = Record<string, any>;

type Consulente = { id: string; nome?: string | null; name?: string | null };
type TipoAbbonamento = { id: string; nome?: string | null; name?: string | null };

type Entry = {
  id: string;
  entry_date: string;            // YYYY-MM-DD
  entry_time: string | null;     // HH:MM:SS
  section: string;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  consulente_id: string | null;
  tipo_abbonamento_id: string | null;
  fonte: string | null;
  comeback: boolean;
  miss: boolean;
  note: string | null;
  venduto: boolean;
  presentato: boolean;
  contattato?: boolean; // NEW per sezione telefonica
  created_at: string;
  updated_at: string;
  consulente?: AnyObj | null;
  tipo_abbonamento?: AnyObj | null;
  whatsapp_sent?: boolean;
};

const SEZIONI = [
  "TOUR SPONTANEI",
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
  "APPUNTAMENTI TELEFONICI",
];

import { getWhatsAppLink, markWhatsAppSent, cleanPhone } from "@/lib/whatsapp";

const lbl = (o?: AnyObj | null) => ((o?.nome ?? o?.name ?? "") as string);

function toHHMM(t: string | null) { if (!t) return ""; const [hh, mm] = String(t).split(":"); return `${hh}:${mm}`; }
function hhmmToDb(t: string) { if (!t) return null; const p = t.split(":"); if (p.length < 2) return null; return `${p[0]}:${p[1]}:00`; }
function nowHHMM() { const d = new Date(); const hh = String(d.getHours()).padStart(2, "0"); const mm = String(d.getMinutes()).padStart(2, "0"); return `${hh}:${mm}`; }
function parseISODate(s: string) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, (m || 1) - 1, d || 1)); }
// function sanitizePhone ... removed
// function waText ... removed

export default function EntriesSection({ title }: { title: string }) {
  const sp = useSearchParams();

  const scope = sp?.get("scope") ?? "day";
  const dateParam = sp?.get("date") ?? getLocalDateISO();
  const fromParam = sp?.get("from") ?? dateParam;
  const toParam = sp?.get("to") ?? dateParam;

  const q = sp?.get("q") ?? "";
  const consulente = sp?.get("consulente") ?? "";
  const tipo = sp?.get("tipo") ?? "";
  const missOnly = sp?.get("miss") === "1";
  const vendutoOnly = sp?.get("venduto") === "1";

  const showDate = useMemo(() => scope !== "day", [scope]);
  const isTelefonici = title === "APPUNTAMENTI TELEFONICI";
  const hasPresentato = !isTelefonici && title !== "TOUR SPONTANEI"; // presentato ovunque tranne tour spontanei e telefonici
  const headerBg = isTelefonici ? "#334155" : "#1AB4B8"; // grigio scuro per telefonici

  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  // Editing (tabella desktop)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Entry>>({});
  const [isNewEditing, setIsNewEditing] = useState(false);

  // Opzioni select
  const [consulenti, setConsulenti] = useState<Consulente[]>([]);
  const [tipi, setTipi] = useState<TipoAbbonamento[]>([]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Modal (mobile) - edit/nuova riga
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingId, setModalEditingId] = useState<string | null>(null);
  const [modalDraft, setModalDraft] = useState<Partial<Entry>>({});

  // Modal DUPLICA
  const [dupOpen, setDupOpen] = useState(false);
  const [dupSource, setDupSource] = useState<Entry | null>(null);
  const [dupSection, setDupSection] = useState<string>(title);
  const [dupDate, setDupDate] = useState<string>(dateParam);
  const [dupTime, setDupTime] = useState<string>("");
  const [dupCopyTelefono, setDupCopyTelefono] = useState(true);
  const [dupCopyFonte, setDupCopyFonte] = useState(true);
  const [dupCopyNote, setDupCopyNote] = useState(true);
  const [dupConsulenteId, setDupConsulenteId] = useState<string>("");
  const [dupTipoId, setDupTipoId] = useState<string>("");

  // Toast "salvato"
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!!(e as MediaQueryList).matches);
    // init
    // @ts-ignore
    handler(mq);
    // listen
    // @ts-ignore
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler as any);
    return () => {
      // @ts-ignore
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler as any);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: cData }, { data: tData }] = await Promise.all([
        supabase.from("consulenti").select("*"),
        supabase.from("tipi_abbonamento").select("*"),
      ]);
      setConsulenti((cData ?? []) as Consulente[]);
      setTipi((tData ?? []) as TipoAbbonamento[]);
    })();
  }, []);

  // Outcome Manager
  const {
    salePopup, setSalePopup,
    reschedulePopup, setReschedulePopup,
    verifyPopup, setVerifyPopup,
    absentPopup, setAbsentPopup,
    rescheduleDrawerOpen, setRescheduleDrawerOpen,
    rescheduleEntryData,
    handleOutcomeClick,
    confirmVerify,
    confirmSale,
    confirmMiss,
    confirmAbsent,
    onRescheduleSaved
  } = useOutcomeManager(() => {
    // Reload logic
    setReloadTrigger(prev => prev + 1);
  });

  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Load subscription types for SalePopup
  const [subscriptionTypes, setSubscriptionTypes] = useState<string[]>([]);
  useEffect(() => {
    if (tipi.length > 0) setSubscriptionTypes(tipi.map(t => t.name || "").filter(Boolean));
  }, [tipi]);


  // ---- LOAD ENTRIES con FILTRI
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      let qy = supabase
        .from("entries")
        .select(`
  *,
  consulente: consulenti(*),
    tipo_abbonamento: tipi_abbonamento(*)
      `)
        .eq("section", title)
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: true });

      if (scope === "day") {
        qy = qy.eq("entry_date", dateParam);
      } else {
        qy = qy.gte("entry_date", fromParam).lte("entry_date", toParam);
      }

      if (q && q.trim().length > 0) {
        const like = `%${q.trim()}%`;
        qy = qy.or(
          `nome.ilike.${like},cognome.ilike.${like},telefono.ilike.${like},fonte.ilike.${like},note.ilike.${like}`
        );
      }

      if (consulente) qy = qy.eq("consulente_id", consulente);
      if (tipo) qy = qy.eq("tipo_abbonamento_id", tipo);
      if (missOnly) qy = qy.eq("miss", true);
      if (vendutoOnly) qy = qy.eq("venduto", true);

      const { data, error } = await qy;
      if (!active) return;
      if (error) {
        console.error("load entries error", error);
        setRows([]);
      } else {
        setRows((data ?? []) as Entry[]);
      }
      setLoading(false);
      setEditingId(null);
      setDraft({});
      setIsNewEditing(false);
    }

    load();
    return () => { active = false; };
  }, [title, scope, dateParam, fromParam, toParam, q, consulente, tipo, missOnly, vendutoOnly]);

  // <-- listener per aggiornare subito la UI quando il popup segna “contattato”
  useEffect(() => {
    const handler = (ev: any) => {
      const id = ev?.detail?.id as string | undefined;
      if (!id) return;
      setRows(prev => prev.map(r => r.id === id ? { ...r, contattato: true } : r));
    };
    window.addEventListener("telefonico:contattato", handler as any);
    return () => window.removeEventListener("telefonico:contattato", handler as any);
  }, []);

  // ---- INSERT (+ edit)
  const handleAdd = async () => {
    if (isMobile) {
      setModalEditingId(null);
      setModalDraft({
        entry_date: scope === "day" ? dateParam : fromParam,
        entry_time: isTelefonici ? "" : (title === "TOUR SPONTANEI" ? nowHHMM() : ""),
        section: title,
        nome: "",
        cognome: "",
        telefono: "",
        consulente_id: null,
        tipo_abbonamento_id: null,
        fonte: "",
        comeback: false,
        miss: false,
        note: "",
        venduto: false,
        presentato: false,
        contattato: false,
      });
      setModalOpen(true);
      return;
    }

    const dateForInsert =
      scope === "day" ? dateParam : scope === "month" ? dateParam : scope === "year" ? dateParam : fromParam;
    const timeForInsert = isTelefonici ? "" : (title === "TOUR SPONTANEI" ? nowHHMM() : "");
    const insertObj = {
      entry_date: dateForInsert,
      entry_time: timeForInsert ? timeForInsert + ":00" : null,
      section: title,
      nome: "",
      cognome: "",
      telefono: "",
      consulente_id: null,
      tipo_abbonamento_id: null,
      fonte: "",
      comeback: false,
      miss: false,
      note: "",
      venduto: false,
      presentato: false,
      contattato: false,
    };
    const { data, error } = await supabase
      .from("entries")
      .insert(insertObj)
      .select(
        `
  *,
  consulente: consulenti(*),
    tipo_abbonamento: tipi_abbonamento(*)
      `
      )
      .single();
    if (error) { alert("Errore inserimento: " + error.message); return; }
    const row = data as Entry;
    setRows((prev) => [row, ...prev]);
    setEditingId(row.id);
    setIsNewEditing(true);
    setDraft({ ...row, entry_time: toHHMM(row.entry_time) });
  };

  // ---- EDIT
  const startEdit = (row: Entry) => {
    if (isMobile) {
      setModalEditingId(row.id);
      setModalDraft({
        ...row,
        entry_time: toHHMM(row.entry_time),
      });
      setModalOpen(true);
      return;
    }
    setEditingId(row.id);
    setIsNewEditing(false);
    setDraft({ ...row, entry_time: toHHMM(row.entry_time) });
  };

  const cancelEdit = async () => {
    if (isNewEditing && editingId) {
      const { error } = await supabase.from("entries").delete().eq("id", editingId);
      if (error) {
        alert("Errore nell'annullare l'inserimento: " + error.message);
      } else {
        setRows((prev) => prev.filter((r) => r.id !== editingId));
      }
    }
    setEditingId(null);
    setDraft({});
    setIsNewEditing(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const d = draft as Entry;
    const payload: Partial<Entry> = {
      nome: d.nome ?? "",
      cognome: d.cognome ?? "",
      telefono: d.telefono ?? "",
      fonte: d.fonte ?? "",
      note: d.note ?? "",
      consulente_id: d.consulente_id ?? null,
      tipo_abbonamento_id: d.tipo_abbonamento_id ?? null,
      comeback: !!d.comeback,
      miss: !!d.miss,
      venduto: !!d.venduto,
      presentato: !!d.presentato,
      contattato: !!d.contattato,
      entry_time: d.entry_time ? (typeof d.entry_time === "string" ? hhmmToDb(d.entry_time) : d.entry_time) : null,
    };
    const { error } = await supabase.from("entries").update(payload).eq("id", editingId);
    if (error) { alert("Errore salvataggio: " + error.message); return; }
    const { data, error: e2 } = await supabase
      .from("entries")
      .select(
        `
      *,
      consulente: consulenti(*),
        tipo_abbonamento: tipi_abbonamento(*)
        `
      )
      .eq("id", editingId)
      .single();
    if (e2) { alert("Errore caricamento riga: " + e2.message); return; }
    const fresh = data as Entry;
    setRows((prev) => prev.map((r) => (r.id === editingId ? fresh : r)));
    setEditingId(null);
    setDraft({});
    setIsNewEditing(false);
  };

  // ---- DELETE
  const handleDelete = async (row: Entry) => {
    if (!confirm("Eliminare questa riga?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", row.id);
    if (error) return alert("Errore eliminazione: " + error.message);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  // ---- WA / CALL


  // ... existing useEffects ...

  // Replace manual handlers with handleOutcomeClick usage in renderRow
  // But first, let's add the Popups to the return JSX
  // We'll do that in a separate edit or at the end of the file.

  // ...

  // ---- WA / CALL
  const handleWhatsApp = async (row: Entry) => {
    const link = getWhatsAppLink(row as any);
    if (!link) return alert("Numero non valido.");

    window.open(link, "_blank");

    if (!row.whatsapp_sent) {
      const success = await markWhatsAppSent(row.id);
      if (success) {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, whatsapp_sent: true } : r));
      }
    }
  };
  const handleCall = (row: Entry) => {
    const to = cleanPhone(row.telefono);
    if (!to) return alert("Numero non valido.");
    window.location.href = `tel:${to}`;
  };

  const toggleContattato = async (row: Entry) => {
    const newValue = !row.contattato;
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, contattato: newValue } : r));
    await supabase.from("entries").update({ contattato: newValue }).eq("id", row.id);
  };

  // Removed manual toggle functions (toggleMiss, toggleVenduto, etc.) as they are replaced by useOutcomeManager


  // ====== DUPLICAZIONE ======
  const openDuplicate = (row: Entry) => {
    setDupSource(row);
    setDupSection(title);
    setDupDate(dateParam);
    setDupTime(toHHMM(row.entry_time));
    setDupCopyTelefono(true);
    setDupCopyFonte(true);
    setDupCopyNote(true);
    setDupConsulenteId(row.consulente_id ?? "");
    setDupTipoId(row.tipo_abbonamento_id ?? "");
    setDupOpen(true);
  };

  const saveDuplicate = async () => {
    if (!dupSource) return;
    const payload: Partial<Entry> = {
      section: dupSection,
      entry_date: dupDate,
      entry_time: dupTime ? hhmmToDb(dupTime) : null,
      nome: dupSource.nome ?? "",
      cognome: dupSource.cognome ?? "",
      telefono: dupCopyTelefono ? (dupSource.telefono ?? "") : "",
      fonte: dupCopyFonte ? (dupSource.fonte ?? "") : "",
      note: dupCopyNote ? (dupSource.note ?? "") : "",
      consulente_id: dupConsulenteId || null,
      tipo_abbonamento_id: dupTipoId || null,
      comeback: false,
      miss: false,
      venduto: false,
      presentato: false,
      contattato: false,
    };

    const { error } = await supabase.from("entries").insert(payload);
    if (error) { alert("Errore duplicazione: " + error.message); return; }

    setDupOpen(false);
    setDupSource(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  // ====== RENDER DESKTOP (tabella)
  const ColGroup = () => {
    if (isTelefonici) {
      const cols: JSX.Element[] = [];
      if (showDate) cols.push(<col key="c-date" style={{ width: "12%" }} />);
      cols.push(<col key="c-ora" style={{ width: 110 }} />);          // ORA per telefonici
      cols.push(<col key="c-nome" style={{ width: "18%" }} />);
      cols.push(<col key="c-cognome" style={{ width: "18%" }} />);
      cols.push(<col key="c-tel" style={{ width: 160 }} />);
      cols.push(<col key="c-consulente" style={{ width: 200 }} />);
      cols.push(<col key="c-note" />);                                 // elastica
      cols.push(<col key="c-contattato" style={{ width: 120 }} />);
      cols.push(<col key="c-actions" style={{ width: 220 }} />);
      return <colgroup>{cols}</colgroup>;
    }

    // Default (sezioni esistenti)
    const cols: JSX.Element[] = [];
    if (showDate) cols.push(<col key="c-date" style={{ width: "10%" }} />);
    cols.push(<col key="c-ora" style={{ width: 100 }} />);
    cols.push(<col key="c-nome" style={{ width: "12%" }} />);
    cols.push(<col key="c-cognome" style={{ width: "12%" }} />);
    cols.push(<col key="c-tel" style={{ width: 130 }} />);
    cols.push(<col key="c-consulente" style={{ width: 160 }} />);
    cols.push(<col key="c-fonte" style={{ width: 120 }} />);
    cols.push(<col key="c-comeback" style={{ width: 90 }} />);
    cols.push(<col key="c-tipo" style={{ width: 160 }} />);
    cols.push(<col key="c-note" />); // flessibile
    cols.push(<col key="c-stato" style={{ width: 200 }} />); // Merged outcome column
    cols.push(<col key="c-actions" style={{ width: 220 }} />);
    return <colgroup>{cols}</colgroup>;
  };

  const Thead = () => {
    if (isTelefonici) {
      return (
        <thead>
          <tr>
            {showDate && <th>Data</th>}
            <th>Ora</th>
            <th>Nome</th>
            <th>Cognome</th>
            <th>Telefono</th>
            <th>Consulente</th>
            <th>Note</th>
            <th className="text-center">Contattato</th>
            <th>Azioni</th>
          </tr>
        </thead>
      );
    }

    return (
      <thead>
        <tr>
          {showDate && <th>Data</th>}
          <th>Ora</th>
          <th>Nome</th>
          <th>Cognome</th>
          <th>Telefono</th>
          <th>Consulente</th>
          <th>Fonte</th>
          <th className="text-center">Come Back</th>
          <th>Tipo Abbonamento</th>
          <th>Note</th>
          <th className="text-center">Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
    );
  };

  const totalCols = (() => {
    if (isTelefonici) {
      // Data (opz) + Ora + Nome + Cognome + Tel + Consulente + Note + Contattato + Azioni
      let base = 8;
      if (showDate) base += 1;
      return base;
    }
    const base = 12 + (hasPresentato ? 1 : 0);
    return base + (showDate ? 1 : 0);
  })();

  const renderRow = (r: Entry) => {
    const isEditing = editingId === r.id;

    if (isTelefonici) {
      return (
        <tr key={r.id}>
          {showDate && (
            <td>{new Intl.DateTimeFormat("it-IT").format(parseISODate(r.entry_date))}</td>
          )}

          {/* ORA (telefonici) */}
          <td className="whitespace-nowrap">
            {isEditing ? (
              <input
                type="time"
                className="input w-[110px] min-w-[110px]"
                value={(draft.entry_time as string) ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, entry_time: e.target.value }))}
              />
            ) : (
              toHHMM(r.entry_time)
            )}
          </td>

          {/* Nome */}
          <td className="break-words">
            {isEditing ? (
              <input className="input" value={(draft.nome as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))} />
            ) : (r.nome ?? "")}
          </td>

          {/* Cognome */}
          <td className="break-words">
            {isEditing ? (
              <input className="input" value={(draft.cognome as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, cognome: e.target.value }))} />
            ) : (r.cognome ?? "")}
          </td>

          {/* Telefono */}
          <td className="break-words">
            {isEditing ? (
              <input className="input" value={(draft.telefono as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))} />
            ) : (r.telefono ?? "")}
          </td>

          {/* Consulente */}
          <td className="break-words">
            {isEditing ? (
              <select className="select" value={(draft.consulente_id as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, consulente_id: e.target.value || null }))}>
                <option value="">—</option>
                {consulenti.map((c) => (<option key={c.id} value={c.id}>{lbl(c)}</option>))}
              </select>
            ) : (lbl(r.consulente))}
          </td>

          {/* Note */}
          <td className="break-words">
            {isEditing ? (
              <input className="input" value={(draft.note as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} />
            ) : (r.note ?? "")}
          </td>

          {/* Contattato */}
          <td className="text-center">
            {isEditing ? (
              <input
                type="checkbox"
                className="check-lg"
                checked={!!draft.contattato}
                onChange={(e) => setDraft((d) => ({ ...d, contattato: e.target.checked }))}
              />
            ) : (
              <input
                type="checkbox"
                className="check-lg"
                checked={!!r.contattato}
                onChange={() => toggleContattato(r)}
              />
            )}
          </td>

          {/* Azioni */}
          <td className="actions-cell whitespace-nowrap">
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button className="btn btn-icon !h-8 !w-8" title="Salva" onClick={saveEdit}>
                    <Check size={14} color="#16a34a" />
                  </button>
                  <button className="btn btn-icon !h-8 !w-8" title="Annulla" onClick={cancelEdit}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-icon !h-8 !w-8" title="WhatsApp" onClick={() => handleWhatsApp(r)}>
                    <MessageCircle size={14} color="#25D366" />
                  </button>
                  <button className="btn btn-icon !h-8 !w-8" title="Chiama" onClick={() => handleCall(r)}>
                    <Phone size={14} color="#1AB4B8" />
                  </button>
                  <button className="btn btn-icon !h-8 !w-8" title="Modifica" onClick={() => startEdit(r)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon !h-8 !w-8" title="Duplica in…" onClick={() => openDuplicate(r)}>
                    <Copy size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon !h-8 !w-8" title="Elimina" onClick={() => handleDelete(r)}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      );
    }

    // --- Righe default (tutte le altre sezioni)
    return (
      <tr
        key={r.id}
        className={
          (isEditing ? !!draft.venduto : r.venduto)
            ? "bg-green-100"
            : (isEditing ? !!draft.miss : r.miss)
              ? "bg-red-100"
              : undefined
        }
      >
        {showDate && (
          <td>{new Intl.DateTimeFormat("it-IT").format(parseISODate(r.entry_date))}</td>
        )}

        {/* ORA */}
        <td className="whitespace-nowrap">
          {isEditing ? (
            <input
              type="time"
              className="input w-[110px] min-w-[110px]"
              value={(draft.entry_time as string) ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, entry_time: e.target.value }))}
            />
          ) : (
            toHHMM(r.entry_time)
          )}
        </td>

        {/* NOME */}
        <td className="break-words">
          {isEditing ? (
            <input className="input" value={(draft.nome as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))} />
          ) : (r.nome ?? "")}
        </td>

        {/* COGNOME */}
        <td className="break-words">
          {isEditing ? (
            <input className="input" value={(draft.cognome as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, cognome: e.target.value }))} />
          ) : (r.cognome ?? "")}
        </td>

        {/* TELEFONO */}
        <td className="break-words">
          {isEditing ? (
            <input className="input" value={(draft.telefono as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))} />
          ) : (r.telefono ?? "")}
        </td>

        {/* CONSULENTE */}
        <td className="break-words">
          {isEditing ? (
            <select className="select" value={(draft.consulente_id as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, consulente_id: e.target.value || null }))}>
              <option value="">—</option>
              {consulenti.map((c) => (<option key={c.id} value={c.id}>{lbl(c)}</option>))}
            </select>
          ) : (lbl(r.consulente))}
        </td>

        {/* FONTE */}
        <td className="break-words">
          {isEditing ? (
            <input className="input" value={(draft.fonte as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, fonte: e.target.value }))} />
          ) : (r.fonte ?? "")}
        </td>

        {/* COMEBACK */}
        <td className="text-center">
          {isEditing ? (
            <input type="checkbox" className="check-lg" checked={!!draft.comeback} onChange={(e) => setDraft((d) => ({ ...d, comeback: e.target.checked }))} />
          ) : (
            <input type="checkbox" className="check-lg" checked={!!r.comeback} readOnly />
          )}
        </td>

        {/* TIPO */}
        <td className="break-words">
          {isEditing ? (
            <select className="select" value={(draft.tipo_abbonamento_id as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, tipo_abbonamento_id: e.target.value || null }))}>
              <option value="">—</option>
              {tipi.map((t) => (<option key={t.id} value={t.id}>{lbl(t)}</option>))}
            </select>
          ) : (lbl(r.tipo_abbonamento))}
        </td>

        {/* NOTE */}
        <td className="break-words">
          {isEditing ? (
            <input className="input" value={(draft.note as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} />
          ) : (r.note ?? "")}
        </td>

        {/* STATO (OutcomeButtons) */}
        <td className="text-center" colSpan={hasPresentato ? 3 : 2}>
          {/* Merging Miss, Presentato, Venduto columns */}
          {isEditing ? (
            <div className="text-xs text-slate-400">Salva per modificare</div>
          ) : (
            <OutcomeButtons
              entry={r}
              onOutcomeClick={(type) => handleOutcomeClick(type, r)}
              size="sm"
              showLabels={false}
            />
          )}
        </td>


        {/* AZIONI */}
        <td className="actions-cell whitespace-nowrap">
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button className="btn btn-icon !h-8 !w-8" title="Salva" onClick={saveEdit}>
                  <Check size={14} color="#16a34a" />
                </button>
                <button className="btn btn-icon !h-8 !w-8" title="Annulla" onClick={cancelEdit}>
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-icon !h-8 !w-8" title="WhatsApp" onClick={() => handleWhatsApp(r)}>
                  <MessageCircle size={14} color="#25D366" />
                </button>
                <button className="btn btn-icon !h-8 !w-8" title="Chiama" onClick={() => handleCall(r)}>
                  <Phone size={14} color="#1AB4B8" />
                </button>
                <button className="btn btn-icon !h-8 !w-8" title="Modifica" onClick={() => startEdit(r)}>
                  <Pencil size={14} />
                </button>
                <button className="btn btn-icon !h-8 !w-8" title="Duplica in…" onClick={() => openDuplicate(r)}>
                  <Copy size={14} />
                </button>
                <button className="btn btn-danger btn-icon !h-8 !w-8" title="Elimina" onClick={() => handleDelete(r)}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr >
    );
  };

  // ====== MODALE MOBILE (nuova/modifica) — RIPRISTINATO e con ORA sempre visibile ======
  const closeModal = () => { setModalOpen(false); setModalEditingId(null); setModalDraft({}); };

  const saveModal = async () => {
    const d = modalDraft as Partial<Entry>;
    const payload: Partial<Entry> = {
      entry_date: (d.entry_date as string) ?? dateParam,
      entry_time: d.entry_time ? (typeof d.entry_time === "string" ? hhmmToDb(d.entry_time) : d.entry_time) : null,
      section: title,
      nome: d.nome ?? "",
      cognome: d.cognome ?? "",
      telefono: d.telefono ?? "",
      consulente_id: d.consulente_id ?? null,
      tipo_abbonamento_id: d.tipo_abbonamento_id ?? null,
      fonte: d.fonte ?? "",
      comeback: !!d.comeback,
      miss: !!d.miss,
      note: d.note ?? "",
      venduto: !!d.venduto,
      presentato: hasPresentato ? !!d.presentato : false,
      contattato: isTelefonici ? !!d.contattato : false,
    };

    if (modalEditingId) {
      const { error } = await supabase.from("entries").update(payload).eq("id", modalEditingId);
      if (error) { alert("Errore salvataggio: " + error.message); return; }
    } else {
      const { error } = await supabase.from("entries").insert(payload);
      if (error) { alert("Errore inserimento: " + error.message); return; }
    }

    closeModal();
    setLoading(true);
    const { data } = await supabase
      .from("entries")
      .select(`
  *,
  consulente: consulenti(*),
    tipo_abbonamento: tipi_abbonamento(*)
      `)
      .eq("section", title)
      .order("entry_date", { ascending: false })
      .order("entry_time", { ascending: true });
    setRows((data ?? []) as Entry[]);
    setLoading(false);
  };

  const onEditMobile = (row: Entry) => {
    setModalEditingId(row.id);
    setModalDraft({
      ...row,
      entry_time: toHHMM(row.entry_time),
    });
    setModalOpen(true);
  };

  return (
    <SectionTableShell title={title} onAdd={handleAdd} headerBg={headerBg}>
      {/* MOBILE: cards */}
      <div className="md:hidden space-y-3 p-3">
        {loading && (
          <div className="text-center text-slate-500 text-sm py-6">
            <span className="spinner-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span>
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-6">Nessuna riga.</div>
        )}
        {!loading && rows.map((r) => (
          <EntryCard
            key={r.id}
            row={r as any}
            onEdit={onEditMobile}
            onDelete={handleDelete}
            onWhatsapp={handleWhatsApp}
            onCall={handleCall}
            onOutcomeClick={handleOutcomeClick}
            onToggleContattato={toggleContattato}
            onDuplicate={openDuplicate}
          />
        ))}
      </div>

      {/* DESKTOP: tabella - NO overflow-x */}
      <div className="hidden md:block">
        <div>
          <table className="w-full table-auto table-flat table-compact table-dividers">
            <ColGroup />
            <Thead />
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={totalCols}>
                    <div className="p-3">
                      <span className="spinner-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={totalCols} className="text-slate-500 p-3">Nessuna riga.</td></tr>
              )}
              {!loading && rows.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODALE DUPLICA ===== */}
      {dupOpen && dupSource && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Duplica riga</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDupOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="text-sm text-slate-600">
              <div className="truncate">
                <span className="font-medium">{dupSource.nome ?? ""} {dupSource.cognome ?? ""}</span>
                {dupSource.telefono ? <> · {dupSource.telefono}</> : null}
              </div>
              <div className="truncate">
                {dupSource.fonte ? <>Fonte: {dupSource.fonte}</> : null}
                {dupSource.note ? <> · Note: {dupSource.note}</> : null}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sezione di destinazione</label>
                <select className="select w-full" value={dupSection} onChange={(e) => setDupSection(e.target.value)}>
                  {SEZIONI.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Data</label>
                  <input type="date" className="input w-full" value={dupDate} onChange={(e) => setDupDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ora</label>
                  <input type="time" className="input w-full" value={dupTime} onChange={(e) => setDupTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Consulente</label>
                <select className="select w-full" value={dupConsulenteId} onChange={(e) => setDupConsulenteId(e.target.value)}>
                  <option value="">—</option>
                  {consulenti.map((c) => (<option key={c.id} value={c.id}>{lbl(c)}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Tipo abbonamento</label>
                <select className="select w-full" value={dupTipoId} onChange={(e) => setDupTipoId(e.target.value)}>
                  <option value="">—</option>
                  {tipi.map((t) => (<option key={t.id} value={t.id}>{lbl(t)}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="check-lg" checked={dupCopyTelefono} onChange={(e) => setDupCopyTelefono(e.target.checked)} />
                  <span>Telefono</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="check-lg" checked={dupCopyFonte} onChange={(e) => setDupCopyFonte(e.target.checked)} />
                  <span>Fonte</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="check-lg" checked={dupCopyNote} onChange={(e) => setDupCopyNote(e.target.checked)} />
                  <span>Note</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-ghost" onClick={() => setDupOpen(false)}>Annulla</button>
              <button className="btn btn-brand" onClick={saveDuplicate}>Duplica</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE MOBILE NUOVA/MODIFICA (VISIBILE SOLO MOBILE) ===== */}
      {modalOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modalEditingId ? "Modifica riga" : "Nuova riga"}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500">Data</label>
                <input
                  type="date"
                  className="input"
                  value={(modalDraft.entry_date as string) ?? dateParam}
                  onChange={(e) => setModalDraft({ ...modalDraft, entry_date: e.target.value })}
                />
              </div>

              {/* ORA: ora sempre visibile (anche per telefonici) */}
              <div>
                <label className="text-xs text-slate-500">Ora</label>
                <input
                  type="time"
                  className="input"
                  value={(modalDraft.entry_time as string) ?? ""}
                  onChange={(e) => setModalDraft({ ...modalDraft, entry_time: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Nome</label>
                  <input
                    className="input"
                    value={(modalDraft.nome as string) ?? ""}
                    onChange={(e) => setModalDraft({ ...modalDraft, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Cognome</label>
                  <input
                    className="input"
                    value={(modalDraft.cognome as string) ?? ""}
                    onChange={(e) => setModalDraft({ ...modalDraft, cognome: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Telefono</label>
                <input
                  className="input"
                  value={(modalDraft.telefono as string) ?? ""}
                  onChange={(e) => setModalDraft({ ...modalDraft, telefono: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Consulente</label>
                <select
                  className="select"
                  value={(modalDraft.consulente_id as string) ?? ""}
                  onChange={(e) => setModalDraft({ ...modalDraft, consulente_id: e.target.value || null })}
                >
                  <option value="">—</option>
                  {consulenti.map((c) => (
                    <option key={c.id} value={c.id}>{lbl(c)}</option>
                  ))}
                </select>
              </div>

              {/* NOTE sempre */}
              <div>
                <label className="text-xs text-slate-500">Note</label>
                <input
                  className="input"
                  value={(modalDraft.note as string) ?? ""}
                  onChange={(e) => setModalDraft({ ...modalDraft, note: e.target.value })}
                />
              </div>

              {/* Switch a seconda della sezione */}
              {isTelefonici ? (
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="check-lg"
                      checked={!!modalDraft.contattato}
                      onChange={(e) => setModalDraft({ ...modalDraft, contattato: e.target.checked })}
                    />
                    <span>Contattato</span>
                  </label>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="check-lg"
                      checked={!!modalDraft.miss}
                      onChange={(e) => setModalDraft({
                        ...modalDraft,
                        miss: e.target.checked,
                        venduto: e.target.checked ? false : modalDraft.venduto
                      })}
                    />
                    <span>Miss</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="check-lg"
                      checked={!!modalDraft.venduto}
                      onChange={(e) => setModalDraft({
                        ...modalDraft,
                        venduto: e.target.checked,
                        miss: e.target.checked ? false : modalDraft.miss
                      })}
                    />
                    <span>Venduto</span>
                  </label>
                  {hasPresentato && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="check-lg"
                        checked={!!modalDraft.presentato}
                        onChange={(e) => setModalDraft({ ...modalDraft, presentato: e.target.checked })}
                      />
                      <span>Presentato</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="check-lg"
                      checked={!!modalDraft.comeback}
                      onChange={(e) => setModalDraft({ ...modalDraft, comeback: e.target.checked })}
                    />
                    <span>Come Back</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-ghost" onClick={closeModal}>Annulla</button>
              <button className="btn btn-brand" onClick={saveModal}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast salvato */}
      {savedToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-emerald-600 text-white px-4 py-2 rounded-lg shadow">
          SALVATO
        </div>
      )}

      {/* Outcome Popups */}
      <SalePopup
        isOpen={salePopup.open}
        onClose={() => setSalePopup({ ...salePopup, open: false })}
        onConfirm={confirmSale}
        subscriptionTypes={subscriptionTypes}
        entry={salePopup.entry}
      />
      <ReschedulePopup
        isOpen={reschedulePopup.open}
        onClose={() => setReschedulePopup({ ...reschedulePopup, open: false })}
        onConfirm={confirmMiss}
        entry={reschedulePopup.entry}
      />
      <VerifyPopup
        isOpen={verifyPopup.open}
        onClose={() => setVerifyPopup({ ...verifyPopup, open: false })}
        onConfirm={confirmVerify}
        entry={verifyPopup.entry}
      />
      <AbsentPopup
        isOpen={absentPopup.open}
        onClose={() => setAbsentPopup({ ...absentPopup, open: false })}
        onConfirm={confirmAbsent}
        entry={absentPopup.entry}
      />

      {/* Reschedule Drawer */}
      <EntryDrawer
        isOpen={rescheduleDrawerOpen}
        onClose={() => setRescheduleDrawerOpen(false)}
        entry={rescheduleEntryData}
        section={rescheduleEntryData?.section || title}
        date={rescheduleEntryData?.entry_date || dateParam}
        onSave={onRescheduleSaved}
        onDelete={() => { }}
      />

    </SectionTableShell>
  );
}