// src/app/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <tr ref={setNodeRef} style={style} className="border-b">
      <td className="py-2 w-8 align-middle">
        <button
          className="cursor-grab text-slate-400 hover:text-slate-600"
          title="Trascina per riordinare"
          {...attributes}
          {...listeners}
        >
          ║
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
        `Errore aggiunta consulente: ${(await res.json()).error ?? res.statusText}`
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
      body: `id=${encodeURIComponent(id)}`,
    });
    if (!res.ok) {
      alert(
        `Errore eliminazione: ${(await res.json()).error ?? res.statusText}`
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
        alert(`Errore invio: ${js.error ?? res.statusText}`);
        return;
      }
      alert(`Agenda inviata. Righe incluse: ${js.sent}`);
    } catch (e: any) {
      alert(`Errore invio: ${String(e?.message ?? e)}`);
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
      alert(`Errore aggiunta tipo: ${(await res.json()).error ?? res.statusText}`);
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
      body: `id=${encodeURIComponent(id)}`,
    });
    if (!res.ok) {
      alert(`Errore eliminazione: ${(await res.json()).error ?? res.statusText}`);
      return;
    }
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
    <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Impostazioni</h1>
        <Link href="/" className="btn">← Torna al Giornalone</Link>
      </div>

      {/* CONSULENTI */}
      <div className="card p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Consulenti</h2>
          {loading && <span className="text-xs text-slate-500">Caricamento…</span>}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input"
            placeholder="Nome consulente"
            value={newConsName}
            onChange={(e) => setNewConsName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Email (opzionale)"
            value={newConsEmail}
            onChange={(e) => setNewConsEmail(e.target.value)}
          />
          <button className="btn btn-brand" onClick={addConsulente}>Aggiungi</button>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndCons}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 w-8"></th>
                  <th className="py-2">Nome</th>
                  <th className="py-2">Email</th>
                  <th className="py-2 w-[300px]">Azioni</th>
                </tr>
              </thead>
              <SortableContext items={consIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {consulenti.map((c) => (
                    <SortableRow key={c.id} id={c.id}>
                      <td className="py-2">{lbl(c)}</td>
                      <td className="py-2">
                        {c.email ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            className="btn"
                            onClick={() => sendAgendaNow(c.id)}
                            disabled={sendingId === c.id}
                            title="Invia subito l'agenda di oggi a questo consulente"
                          >
                            {sendingId === c.id ? "Invio…" : "Invia agenda"}
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => deleteConsulente(c.id)}
                            title="Elimina"
                          >
                            Elimina
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                  {consulenti.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        Nessun consulente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {/* TIPI ABBONAMENTO */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Tipi Abbonamento</h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input"
            placeholder="Nome tipo"
            value={newTipoName}
            onChange={(e) => setNewTipoName(e.target.value)}
          />
          <button className="btn btn-brand" onClick={addTipo}>Aggiungi</button>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndTipi}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 w-8"></th>
                  <th className="py-2">Nome</th>
                  <th className="py-2 w-[160px]">Azioni</th>
                </tr>
              </thead>
              <SortableContext items={tipiIds} strategy={verticalListSortingStrategy}>
                <tbody>
                  {tipi.map((t) => (
                    <SortableRow key={t.id} id={t.id}>
                      <td className="py-2">{lbl(t)}</td>
                      <td className="py-2">
                        <button
                          className="btn btn-ghost"
                          onClick={() => deleteTipo(t.id)}
                          title="Elimina"
                        >
                          Elimina
                        </button>
                      </td>
                    </SortableRow>
                  ))}
                  {tipi.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500">
                        Nessun tipo abbonamento.
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
  );
}