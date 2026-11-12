"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Database,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  History,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  Plus,
  RotateCcw,
  X,
  Bookmark,
  BookmarkCheck,
  Tag
} from "lucide-react";

interface QueryResult {
  success: boolean;
  question: string;
  sql: string;
  explanation: string;
  modelUsed?: string;
  rowCount: number;
  results: Record<string, any>[];
  executionTimeMs?: number;
  error?: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  badge?: string;
  createdAt: string;
}

export interface RecentSearch {
  id: string;
  question: string;
  timestamp: string;
  rowCount: number;
  executionTimeMs?: number;
}

const DEFAULT_PROMPTS: SavedPrompt[] = [
  {
    id: "default-1",
    title: "Verifiche del Bisogno dopo acquisto",
    badge: "Consigliato",
    prompt: "Voglio sapere tutte le persone che hanno comprato un abbonamento e che da quella data in poi hanno un appuntamento nella sezione verifiche del bisogno.",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-2",
    title: "Vendite del mese per consulente",
    badge: "Performance",
    prompt: "Quante vendite di abbonamento ci sono state questo mese suddivise per ciascun consulente?",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-3",
    title: "Motivi esito negativo consulenze",
    badge: "Statistiche",
    prompt: "Quali sono le motivazioni di esito negativo più frequenti nelle consulenze e quante volte compaiono?",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-4",
    title: "Miss reali degli ultimi 60 giorni",
    badge: "Recupero",
    prompt: "Mostrami tutti i miss degli ultimi 60 giorni senza duplicati.",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-5",
    title: "Pass consegnati non ancora iscritti",
    badge: "Pass",
    prompt: "Mostrami i pass consegnati dove il referral (amico invitato) non è ancora iscritto.",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-6",
    title: "Verifiche del Bisogno mancanti",
    badge: "Consigliato",
    prompt: "Mostrami tutti gli iscritti attivi a cui non è ancora stata fissata la verifica del bisogno, distinguendo chi è entro i 15 giorni e chi oltre.",
    createdAt: new Date().toISOString()
  }
];

export default function AskClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistent States
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(DEFAULT_PROMPTS);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Active section tab: 'favorites' | 'history'
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");

  // Save Prompt Modal / Popover State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptBadge, setNewPromptBadge] = useState("Personale");
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // UI States
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    setIsClient(true);
    try {
      const storedPrompts = localStorage.getItem("restart_ask_saved_prompts");
      const defaultsVersion = localStorage.getItem("restart_ask_defaults_version");
      if (storedPrompts) {
        const parsedPrompts: SavedPrompt[] = JSON.parse(storedPrompts);
        if (defaultsVersion !== "2") {
          const existingIds = new Set(parsedPrompts.map(p => p.id));
          const merged = parsedPrompts.map(p => {
            if (p.id === "default-4") {
              const updatedDefault4 = DEFAULT_PROMPTS.find(d => d.id === "default-4");
              return updatedDefault4 || p;
            }
            return p;
          });
          DEFAULT_PROMPTS.forEach(d => {
            if (!existingIds.has(d.id)) {
              merged.push(d);
            }
          });
          setSavedPrompts(merged);
          localStorage.setItem("restart_ask_saved_prompts", JSON.stringify(merged));
          localStorage.setItem("restart_ask_defaults_version", "2");
        } else {
          setSavedPrompts(parsedPrompts);
        }
      } else {
        localStorage.setItem("restart_ask_saved_prompts", JSON.stringify(DEFAULT_PROMPTS));
        localStorage.setItem("restart_ask_defaults_version", "2");
      }

      const storedRecent = localStorage.getItem("restart_ask_recent_searches");
      if (storedRecent) {
        setRecentSearches(JSON.parse(storedRecent));
      }
    } catch (e) {
      console.error("Errore lettura localStorage:", e);
    }
  }, []);

  const updateSavedPrompts = (newList: SavedPrompt[]) => {
    setSavedPrompts(newList);
    try {
      localStorage.setItem("restart_ask_saved_prompts", JSON.stringify(newList));
    } catch (e) {
      console.error("Errore salvataggio prompt:", e);
    }
  };

  const updateRecentSearches = (newList: RecentSearch[]) => {
    setRecentSearches(newList);
    try {
      localStorage.setItem("restart_ask_recent_searches", JSON.stringify(newList));
    } catch (e) {
      console.error("Errore salvataggio cronologia:", e);
    }
  };

  // Delete a saved prompt
  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Vuoi davvero eliminare questo prompt frequente?")) {
      const filtered = savedPrompts.filter(p => p.id !== id);
      updateSavedPrompts(filtered);
    }
  };

  // Restore default prompts
  const handleRestoreDefaults = () => {
    if (confirm("Vuoi ripristinare i prompt frequenti predefiniti di Restart? I tuoi prompt personalizzati verranno mantenuti.")) {
      const existingIds = new Set(savedPrompts.map(p => p.id));
      const merged = [...savedPrompts];
      DEFAULT_PROMPTS.forEach(d => {
        if (!existingIds.has(d.id)) {
          merged.push(d);
        }
      });
      updateSavedPrompts(merged);
    }
  };

  // Delete a single recent search
  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = recentSearches.filter(r => r.id !== id);
    updateRecentSearches(filtered);
  };

  // Clear all recent searches
  const handleClearAllRecent = () => {
    if (confirm("Sei sicuro di voler cancellare tutta la cronologia delle ricerche?")) {
      updateRecentSearches([]);
    }
  };

  // Open save modal with prompt
  const handleOpenSaveModal = (promptText?: string) => {
    const text = (promptText ?? question).trim();
    if (!text) return;
    setNewPromptText(text);
    // Generate suggested title
    const cleanWords = text.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).slice(0, 4).join(" ");
    setNewPromptTitle(cleanWords.length > 0 ? cleanWords.charAt(0).toUpperCase() + cleanWords.slice(1) : "Nuovo prompt");
    setNewPromptBadge("Preferito");
    setIsSaveModalOpen(true);
  };

  // Confirm save prompt
  const handleSavePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptTitle.trim() || !newPromptText.trim()) return;

    const newPrompt: SavedPrompt = {
      id: "prompt-" + Date.now(),
      title: newPromptTitle.trim(),
      prompt: newPromptText.trim(),
      badge: newPromptBadge.trim() || "Frequente",
      createdAt: new Date().toISOString()
    };

    const updated = [newPrompt, ...savedPrompts];
    updateSavedPrompts(updated);
    setIsSaveModalOpen(false);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 2500);
  };

  // Main Ask handler
  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk ?? question).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setTableSearch("");
    setSortColumn(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question: q }),
      });

      clearTimeout(timeoutId);
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || `Errore del server (${res.status})`);
      }

      setData(resData);

      // Save to recent searches (deduplicate and keep top 30)
      const newRecent: RecentSearch = {
        id: "recent-" + Date.now(),
        question: q,
        timestamp: new Date().toISOString(),
        rowCount: resData.rowCount || 0,
        executionTimeMs: resData.executionTimeMs
      };

      const updatedRecent = [
        newRecent,
        ...recentSearches.filter(r => r.question.toLowerCase() !== q.toLowerCase())
      ].slice(0, 30);

      updateRecentSearches(updatedRecent);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Errore interrogazione:", err);
      if (err.name === "AbortError") {
        setError("La richiesta ha impiegato troppo tempo. Riprova tra un istante.");
      } else {
        setError(err.message || "Si è verificato un errore durante l'interrogazione.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Check if current question is already saved as a prompt
  const isCurrentQuestionSaved = useMemo(() => {
    if (!question.trim()) return false;
    return savedPrompts.some(p => p.prompt.trim().toLowerCase() === question.trim().toLowerCase());
  }, [question, savedPrompts]);

  // Columns detection
  const columns = useMemo(() => {
    if (!data?.results || data.results.length === 0) return [];
    return Object.keys(data.results[0]);
  }, [data?.results]);

  // Client-side filtering & sorting
  const filteredAndSortedRows = useMemo(() => {
    if (!data?.results) return [];
    let rows = [...data.results];

    // Filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter(row =>
        Object.values(row).some(val =>
          String(val ?? "").toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [data?.results, tableSearch, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // Copy SQL
  const handleCopySql = () => {
    if (!data?.sql) return;
    navigator.clipboard.writeText(data.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!data?.results || data.results.length === 0) return;
    const cols = Object.keys(data.results[0]);
    
    // Build CSV with BOM for Excel UTF-8 support
    const header = cols.map(c => `"${c.replace(/"/g, '""')}"`).join(";");
    const lines = filteredAndSortedRows.map(row => {
      return cols.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(";");
    });

    const csvContent = "\uFEFF" + [header, ...lines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `estrazione_dati_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Tabular Data (TSV for Excel/Sheets paste)
  const handleCopyData = () => {
    if (!data?.results || data.results.length === 0) return;
    const cols = Object.keys(data.results[0]);
    const header = cols.join("\t");
    const lines = filteredAndSortedRows.map(row => {
      return cols.map(col => String(row[col] ?? "")).join("\t");
    });
    const tsv = [header, ...lines].join("\n");
    navigator.clipboard.writeText(tsv);
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  // Format header label from snake_case
  const formatColHeader = (col: string) => {
    return col
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format cell value
  const formatCellValue = (val: any) => {
    if (val === null || val === undefined || val === "") {
      return <span className="text-slate-300">-</span>;
    }
    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Sì
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
          No
        </span>
      );
    }
    // Check if ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM...)
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const parts = val.slice(0, 10).split("-");
      if (parts.length === 3) {
        return <span className="font-medium text-slate-700">{`${parts[2]}/${parts[1]}/${parts[0]}`}</span>;
      }
    }
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#1ea2a7] to-[#2cd4da] flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                    Chiedi ai Dati
                    <span className="text-xs font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                      AI Assistant
                    </span>
                  </h1>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Fai qualsiasi domanda in linguaggio naturale: l&apos;AI traduce la tua richiesta in query ed estrae i dati in tempo reale.
              </p>
            </div>

            {/* Header Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  activeTab === "favorites"
                    ? "bg-amber-50 text-amber-900 border-amber-300 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>{savedPrompts.length} Frequenti</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  activeTab === "history"
                    ? "bg-cyan-50 text-cyan-900 border-cyan-300 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <History size={13} className="text-cyan-600" />
                <span>{recentSearches.length} Recenti</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Search & Prompt Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 transition-all focus-within:border-cyan-400 focus-within:shadow-md">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Es: 'Voglio sapere tutte le persone che hanno comprato un abbonamento e che da quella data in poi hanno una Verifica del Bisogno'..."
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl bg-slate-50 border border-slate-200 p-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all disabled:opacity-50"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">Invio</kbd>
                <span>per inviare</span>
                <span className="text-slate-300">•</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">Shift + Invio</kbd>
                <span>per a capo</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Save Prompt Button */}
                {question.trim() && (
                  <button
                    onClick={() => handleOpenSaveModal()}
                    disabled={loading}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                      isCurrentQuestionSaved
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-200 hover:border-amber-300"
                    }`}
                    title={isCurrentQuestionSaved ? "Prompt già presente nei frequenti" : "Salva tra i prompt frequenti"}
                  >
                    <Star size={13} className={isCurrentQuestionSaved ? "text-amber-500 fill-amber-500" : "text-amber-500"} />
                    <span>{isCurrentQuestionSaved ? "Salvato nei frequenti" : "Salva prompt"}</span>
                  </button>
                )}

                {question && (
                  <button
                    onClick={() => setQuestion("")}
                    disabled={loading}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancella
                  </button>
                )}

                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !question.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#21b5ba] to-[#1a9ca1] hover:opacity-95 active:scale-95 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Elaborazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Chiedi ai Dati</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notification for Saved Prompt */}
          {savedSuccessToast && (
            <div className="mt-3 py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check size={14} className="text-emerald-600" />
              <span>Prompt salvato con successo nelle tue ricerche frequenti!</span>
            </div>
          )}

          {/* Tab Navigation: Frequent Prompts vs Recent History */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "favorites"
                      ? "bg-amber-100/70 text-amber-900 border border-amber-300/80 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>Ricerche Frequenti ({savedPrompts.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "history"
                      ? "bg-cyan-100/70 text-cyan-900 border border-cyan-300/80 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <History size={13} className="text-cyan-600" />
                  <span>Cronologia Recente ({recentSearches.length})</span>
                </button>
              </div>

              {/* Action tools depending on active tab */}
              <div className="flex items-center gap-2">
                {activeTab === "favorites" ? (
                  <>
                    <button
                      onClick={() => handleOpenSaveModal()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-md transition-all"
                    >
                      <Plus size={12} />
                      <span>Nuovo prompt</span>
                    </button>
                    <button
                      onClick={handleRestoreDefaults}
                      title="Ripristina prompt predefiniti"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-all"
                    >
                      <RotateCcw size={11} />
                      <span>Predefiniti</span>
                    </button>
                  </>
                ) : (
                  recentSearches.length > 0 && (
                    <button
                      onClick={handleClearAllRecent}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md transition-all"
                    >
                      <Trash2 size={11} />
                      <span>Cancella cronologia</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* TAB CONTENT: SAVED PROMPTS */}
            {activeTab === "favorites" && (
              <div>
                {savedPrompts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Star size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Nessun prompt frequente salvato</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Scrivi una domanda nel campo sopra e clicca &quot;Salva prompt&quot;, oppure ripristina i predefiniti.
                    </p>
                    <button
                      onClick={handleRestoreDefaults}
                      className="mt-3 text-xs font-bold text-cyan-600 hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Ripristina i prompt suggeriti di Restart</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {savedPrompts.map(item => (
                      <div
                        key={item.id}
                        className="group relative inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 transition-all text-left shadow-2xs"
                      >
                        <button
                          onClick={() => {
                            setQuestion(item.prompt);
                            handleAsk(item.prompt);
                          }}
                          disabled={loading}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:text-amber-900 font-semibold"
                        >
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-100 group-hover:border-amber-200 group-hover:text-amber-700">
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Delete prompt button */}
                        <button
                          onClick={e => handleDeletePrompt(item.id, e)}
                          title="Elimina questo prompt frequente"
                          className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: RECENT SEARCHES */}
            {activeTab === "history" && (
              <div>
                {recentSearches.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <History size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Nessuna ricerca recente in cronologia</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Le domande che invierai verranno salvate qui per essere rieseguite o salvate con un click.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {recentSearches.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setQuestion(r.question);
                          handleAsk(r.question);
                        }}
                        className="group flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 hover:bg-cyan-50/70 border border-slate-100 hover:border-cyan-200 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <History size={13} className="text-slate-400 group-hover:text-cyan-600 transition-colors flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">
                            {r.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {r.rowCount} {r.rowCount === 1 ? "riga" : "righe"}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>

                          {/* Quick Save to Frequent */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenSaveModal(r.question);
                            }}
                            title="Salva questa ricerca tra i prompt frequenti"
                            className="p-1 rounded text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <Star size={13} />
                          </button>

                          {/* Delete from recent */}
                          <button
                            onClick={e => handleDeleteRecent(r.id, e)}
                            title="Rimuovi da cronologia"
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading Banner */}
        {loading && (
          <div className="bg-white rounded-2xl border border-cyan-100 p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
            <div className="h-12 w-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">L&apos;AI sta analizzando la tua domanda...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generazione della query SQL, verifica di sicurezza ed esecuzione su Supabase in corso.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 flex items-start gap-3 shadow-sm">
            <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-bold">Impossibile completare la richiesta</div>
              <div className="mt-1 text-rose-700">{error}</div>
              <button
                onClick={() => handleAsk()}
                className="mt-3 text-xs font-bold underline hover:no-underline text-rose-800"
              >
                Riprova
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {data && !loading && (
          <div className="space-y-4">
            {/* Explanation & Summary Card */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent border border-cyan-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-100/80 px-2.5 py-0.5 rounded-md">
                      <Sparkles size={12} />
                      Interpretazione AI
                    </span>
                    {data.executionTimeMs && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {(data.executionTimeMs / 1000).toFixed(2)}s
                      </span>
                    )}
                    {data.modelUsed && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ({data.modelUsed})
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {data.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center shadow-xs">
                    <div className="text-lg font-black text-slate-900">{data.rowCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {data.rowCount === 1 ? "Risultato" : "Risultati"}
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL Toggle Accordion */}
              <div className="mt-4 pt-3 border-t border-cyan-200/50">
                <button
                  onClick={() => setShowSql(!showSql)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-900 transition-colors"
                >
                  <Database size={13} />
                  <span>{showSql ? "Nascondi Query SQL" : "Visualizza Query SQL Generata"}</span>
                  {showSql ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showSql && (
                  <div className="mt-2.5 bg-slate-900 rounded-xl p-3.5 text-slate-100 font-mono text-xs relative group shadow-inner">
                    <button
                      onClick={handleCopySql}
                      className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
                    >
                      {copiedSql ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedSql ? "Copiata!" : "Copia SQL"}</span>
                    </button>
                    <pre className="overflow-x-auto whitespace-pre-wrap pr-24 leading-relaxed text-cyan-300">
                      {data.sql}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Results Table Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filtra tra questi risultati..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 shadow-xs"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyData}
                    disabled={data.rowCount === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs disabled:opacity-50"
                    title="Copia dati per Excel o Google Fogli"
                  >
                    {copiedData ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedData ? "Copiato!" : "Copia Tabella"}</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    disabled={data.rowCount === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-xs font-bold text-cyan-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <Download size={13} />
                    <span>Esporta CSV</span>
                  </button>
                </div>
              </div>

              {/* Table / Empty State */}
              {columns.length === 0 || data.rowCount === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Database size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Nessun record trovato</p>
                  <p className="text-xs text-slate-400 mt-1">
                    La query non ha prodotto righe con i criteri specificati.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3.5 w-12 text-slate-400 font-mono text-center">#</th>
                          {columns.map(col => {
                            const isSorted = sortColumn === col;
                            return (
                              <th
                                key={col}
                                onClick={() => handleSort(col)}
                                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 transition-colors select-none whitespace-nowrap"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>{formatColHeader(col)}</span>
                                  {isSorted ? (
                                    sortDirection === "asc" ? (
                                      <ArrowUp size={12} className="text-cyan-600 font-bold" />
                                    ) : (
                                      <ArrowDown size={12} className="text-cyan-600 font-bold" />
                                    )
                                  ) : (
                                    <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-500" />
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedRows.length === 0 ? (
                          <tr>
                            <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400">
                              Nessuna riga corrisponde al filtro di ricerca corrente.
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row, rIdx) => {
                            const rowNumber = (currentPage - 1) * pageSize + rIdx + 1;
                            return (
                              <tr
                                key={rIdx}
                                className="hover:bg-cyan-50/40 transition-colors group"
                              >
                                <td className="py-2.5 px-3.5 text-center font-mono text-[10px] text-slate-300 group-hover:text-slate-500">
                                  {rowNumber}
                                </td>
                                {columns.map(col => (
                                  <td
                                    key={col}
                                    className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap group-hover:text-slate-900"
                                  >
                                    {formatCellValue(row[col])}
                                  </td>
                                ))}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>Mostra</span>
                      <select
                        value={pageSize}
                        onChange={e => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value={15}>15 righe</option>
                        <option value={25}>25 righe</option>
                        <option value={50}>50 righe</option>
                        <option value={100}>100 righe</option>
                      </select>
                      <span>
                        di <span className="font-bold text-slate-800">{filteredAndSortedRows.length}</span> righe
                        {tableSearch && ` (filtrate su ${data.rowCount})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600">
                        Pagina {currentPage} di {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Prompt Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <span>Salva tra le Ricerche Frequenti</span>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePromptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Titolo breve del prompt
                </label>
                <input
                  type="text"
                  value={newPromptTitle}
                  onChange={e => setNewPromptTitle(e.target.value)}
                  placeholder="Es: Verifiche post vendita"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Testo della domanda
                </label>
                <textarea
                  value={newPromptText}
                  onChange={e => setNewPromptText(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Etichetta / Categoria (opzionale)
                </label>
                <input
                  type="text"
                  value={newPromptBadge}
                  onChange={e => setNewPromptBadge(e.target.value)}
                  placeholder="Es: Vendite, Consulenze, Personale"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#21b5ba] to-[#1a9ca1] rounded-lg shadow-sm hover:opacity-95 transition-all"
                >
                  Salva Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
