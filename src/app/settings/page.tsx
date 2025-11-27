"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Send, Loader2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Consulente = {
  id: string;
  name?: string;
  nome?: string;
  email?: string | null;
  sort_order?: number | null;
};

type Tipo = {
  id: string;
  name?: string;
  nome?: string;
  sort_order?: number | null;
};

const lbl = (o: any) => (o?.name ?? o?.nome ?? "") as string;

// ---------- Sortable Row primitive ----------
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    position: isDragging ? "relative" : "static",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-slate-50 transition-colors",
        isDragging ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50"
      )}
    >
      <td className="py-3 pl-4 w-10 align-middle">
        <button
          className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing p-1 rounded hover:bg-slate-200/50 transition-colors"
          title="Trascina per riordinare"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </td>
      {children}
    </tr>
  );
}

// --------------------------------------------

export default function SettingsPage() {
  const [consulenti, setConsulenti] = useState<Consulente[]>([]);
  const [tipi, setTipi] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [newConsName, setNewConsName] = useState("");
  const [newConsEmail, setNewConsEmail] = useState("");
  const [newTipoName, setNewTipoName] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  async function fetchAll() {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch("/api/settings/consulente/list"),
        fetch("/api/settings/tipo/list"),
      ]);
      const [cjs, tjs] = await Promise.all([cRes.json(), tRes.json()]);
      const cs = (cjs?.items ?? []).sort(
        (a: any, b: any) =>
          Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
          lbl(a).localeCompare(lbl(b), "it", { sensitivity: "base" })
      );
      const ts = (tjs?.items ?? []).sort(
        (a: any, b: any) =>
          Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
          lbl(a).localeCompare(lbl(b), "it", { sensitivity: "base" })
      );
      setConsulenti(cs);
      setTipi(ts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // ------- Add / Delete / Send -------
  async function addConsulente() {
    if (!newConsName.trim()) return;
    const res = await fetch("/api/settings/consulente/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newConsName.trim(),
        email: newConsEmail.trim() || null,
      }),
    });
    if (!res.ok) {
      alert(
        `Errore aggiunta consulente: ${(await res.json()).error ?? res.statusText} `
      );
      return;
    }
    setNewConsName("");
    setNewConsEmail("");
    fetchAll();
  }

  async function deleteConsulente(id: string) {
    if (!confirm("Eliminare questo consulente?")) return;
    const res = await fetch("/api/settings/consulente/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id = ${encodeURIComponent(id)} `,
    });
    if (!res.ok) {
      alert(
        `Errore eliminazione: ${(await res.json()).error ?? res.statusText} `
      );
      return;
    }
    fetchAll();
  }

  async function sendAgendaNow(id: string) {
    try {
      setSendingId(id);
      const res = await fetch("/api/settings/consulente/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const js = await res.json();
      if (!res.ok) {
        alert(`Errore invio: ${js.error ?? res.statusText} `);
        return;
      }
      alert(`Agenda inviata.Righe incluse: ${js.sent} `);
    } catch (e: any) {
      alert(`Errore invio: ${String(e?.message ?? e)} `);
    } finally {
      setSendingId(null);
    }
  }

  async function addTipo() {
    if (!newTipoName.trim()) return;
    const res = await fetch("/api/settings/tipo/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTipoName.trim() }),
    });
    if (!res.ok) {
      alert(`Errore aggiunta tipo: ${(await res.json()).error ?? res.statusText} `);
      return;
    }
    setNewTipoName("");
    fetchAll();
  }

  async function deleteTipo(id: string) {
    if (!confirm("Eliminare questo tipo?")) return;
    const res = await fetch("/api/settings/tipo/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id = ${encodeURIComponent(id)} `,
    });
    if (!res.ok) {
      alert(`Errore eliminazione: ${(await res.json()).error ?? res.statusText} `);
      return;
    }
    fetchAll();
  }

  // ------- Edit Handlers -------
  function startEdit(item: any) {
    setEditingId(item.id);
    // Normalize fields
    setEditForm({
      id: item.id,
      name: item.name || item.nome || "",
      email: item.email || ""
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveConsulente() {
    const res = await fetch("/api/settings/consulente/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      alert(`Errore aggiornamento: ${(await res.json()).error ?? res.statusText} `);
      return;
    }
    setEditingId(null);
    fetchAll();
  }

  async function saveTipo() {
    const res = await fetch("/api/settings/tipo/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editForm.id,
        name: editForm.name
      }),
    });
    if (!res.ok) {
      alert(`Errore aggiornamento: ${(await res.json()).error ?? res.statusText} `);
      return;
    }
    setEditingId(null);
    fetchAll();
  }

  // ------- Drag end handlers -------
  function onDragEndCons(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = consulenti.findIndex((x) => x.id === active.id);
    const newIndex = consulenti.findIndex((x) => x.id === over.id);
    const newArr = arrayMove(consulenti, oldIndex, newIndex);
    setConsulenti(newArr);
    // salva ordine
    fetch("/api/settings/consulente/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newArr.map((x) => x.id) }),
    }).then((r) => {
      if (!r.ok) console.error("Errore salvataggio ordine consulenti");
    });
  }

  function onDragEndTipi(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tipi.findIndex((x) => x.id === active.id);
    const newIndex = tipi.findIndex((x) => x.id === over.id);
    const newArr = arrayMove(tipi, oldIndex, newIndex);
    setTipi(newArr);
    // salva ordine
    fetch("/api/settings/tipo/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newArr.map((x) => x.id) }),
    }).then((r) => {
      if (!r.ok) console.error("Errore salvataggio ordine tipi");
    });
  }

  const consIds = useMemo(() => consulenti.map((c) => c.id), [consulenti]);
  const tipiIds = useMemo(() => tipi.map((t) => t.id), [tipi]);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Impostazioni</h1>
      </div>

      {/* CONSULENTI */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Consulenti</h2>
            <p className="text-sm text-slate-500">Gestisci il team e gli indirizzi email per l'invio agenda</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-brand font-medium">
              <Loader2 size={16} className="animate-spin" />
              Aggiornamento...
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Add New */}
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white"
                placeholder="Es. Mario Rossi"
                value={newConsName}
                onChange={(e) => setNewConsName(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white"
                placeholder="mario@example.com"
                value={newConsEmail}
                onChange={(e) => setNewConsEmail(e.target.value)}
              />
            </div>
            <button
              className="w-full md:w-auto px-6 py-2.5 bg-brand text-white font-medium rounded-lg hover:bg-brand-ink shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
              onClick={addConsulente}
            >
              <Plus size={18} />
              Aggiungi
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCons}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="py-3 pl-4 w-10"></th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Nome</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Email</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Azioni</th>
                  </tr>
                </thead>
                <SortableContext items={consIds} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-slate-50">
                    {consulenti.map((c) => {
                      const isEditing = editingId === c.id;
                      return (
                        <SortableRow key={c.id} id={c.id}>
                          {isEditing ? (
                            <>
                              <td className="py-3 px-4">
                                <input
                                  className="w-full px-2 py-1 rounded border border-slate-300 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  className="w-full px-2 py-1 rounded border border-slate-300 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                  value={editForm.email}
                                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={saveConsulente} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"><Check size={18} /></button>
                                  <button onClick={cancelEdit} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 font-medium text-slate-700">{lbl(c)}</td>
                              <td className="py-3 px-4 text-slate-600">
                                {c.email ? (
                                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                    {c.email}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">Nessuna email</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    className={cn(
                                      "p-2 rounded-lg transition-all border border-transparent",
                                      sendingId === c.id
                                        ? "bg-brand/10 text-brand border-brand/20"
                                        : "text-slate-400 hover:text-brand hover:bg-brand/5"
                                    )}
                                    onClick={() => sendAgendaNow(c.id)}
                                    disabled={sendingId === c.id}
                                    title="Invia agenda via email"
                                  >
                                    {sendingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                  </button>
                                  <button
                                    className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition-all"
                                    onClick={() => startEdit(c)}
                                    title="Modifica"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                    onClick={() => deleteConsulente(c.id)}
                                    title="Elimina consulente"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </SortableRow>
                      );
                    })}
                    {consulenti.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                          Nessun consulente inserito.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
      </div>

      {/* TIPI ABBONAMENTO */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tipi Abbonamento</h2>
            <p className="text-sm text-slate-500">Personalizza le opzioni disponibili per i nuovi ingressi</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome Tipo</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white"
                placeholder="Es. Annuale, Mensile..."
                value={newTipoName}
                onChange={(e) => setNewTipoName(e.target.value)}
              />
            </div>
            <button
              className="w-full md:w-auto px-6 py-2.5 bg-brand text-white font-medium rounded-lg hover:bg-brand-ink shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
              onClick={addTipo}
            >
              <Plus size={18} />
              Aggiungi
            </button>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndTipi}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="py-3 pl-4 w-10"></th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Nome</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Azioni</th>
                  </tr>
                </thead>
                <SortableContext items={tipiIds} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-slate-50">
                    {tipi.map((t) => {
                      const isEditing = editingId === t.id;
                      return (
                        <SortableRow key={t.id} id={t.id}>
                          {isEditing ? (
                            <>
                              <td className="py-3 px-4">
                                <input
                                  className="w-full px-2 py-1 rounded border border-slate-300 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={saveTipo} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"><Check size={18} /></button>
                                  <button onClick={cancelEdit} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 font-medium text-slate-700">{lbl(t)}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  className="p-2 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition-all"
                                  onClick={() => startEdit(t)}
                                  title="Modifica"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                  onClick={() => deleteTipo(t.id)}
                                  title="Elimina tipo"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </>
                          )}
                        </SortableRow>
                      );
                    })}
                    {tipi.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                          Nessun tipo di abbonamento inserito.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}