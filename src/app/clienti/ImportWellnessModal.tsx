"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, FileText, Loader2, RefreshCw } from "lucide-react";

interface ImportWellnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportWellnessModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportWellnessModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Seleziona prima un file CSV da Wellness in Cloud.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Errore durante l'importazione del file.");
      }

      setResult(data);
      onImportSuccess();
    } catch (err: any) {
      setError(err.message || "Errore imprevisto.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Importa da Wellness in Cloud</h3>
              <p className="text-xs text-slate-500">Sincronizza anagrafica, abbonamenti e scadenze</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-cyan-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
                  <FileText size={24} />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Clicca per cambiare file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Trascina qui il file CSV esportato da Wellness
                    </p>
                    <p className="text-xs text-slate-400 mt-1">oppure clicca per sfogliare dal tuo computer</p>
                  </div>
                )}
              </div>

              {/* Informative Note */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  Cosa fa questa sincronizzazione:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-500">
                  <li>Unifica i clienti e memorizza la <b>scadenza futura</b> (gestendo i rinnovi).</li>
                  <li>Categorizza in automatico gli abbonamenti (<i>Annuale, Quadrimestrale, Mensile</i>).</li>
                  <li>Collega in automatico gli appuntamenti passati e futuri presenti in Agenda.</li>
                  <li><b>Non altera</b> i consulenti interni già salvati sul Giornalone.</li>
                </ul>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Success Summary */
            <div className="space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-lg">Sincronizzazione completata!</h4>
                <p className="text-xs text-slate-500 mt-0.5">I dati di Wellness in Cloud sono stati aggiornati.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Clienti unici</div>
                  <div className="text-xl font-black text-slate-800 mt-0.5">{result.unique_clients}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Nuovi inseriti</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">{result.inserted}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Aggiornati</div>
                  <div className="text-xl font-black text-cyan-600 mt-0.5">{result.updated}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Appuntamenti agganciati</div>
                  <div className="text-xl font-black text-indigo-600 mt-0.5">{result.linked_entries}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importazione in corso...</span>
                  </>
                ) : (
                  <span>Avvia Sincronizzazione</span>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Chiudi e visualizza
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
