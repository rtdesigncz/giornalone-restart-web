import { useState } from "react";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";
import { supabase } from "@/lib/supabaseClient";

export default function MoveSectionModal({ 
  isOpen, 
  onClose, 
  entry, 
  onMoved 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  entry: any, 
  onMoved: () => void 
}) {
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (!selectedSection || !entry) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("entries").update({ section: selectedSection }).eq("id", entry.id);
      if (error) throw error;
      onMoved();
      onClose();
    } catch (e) {
      alert("Errore durante lo spostamento");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Sposta Cliente</h3>
          <p className="text-sm text-slate-500 mt-1">
            Stai spostando <b>{entry.nome} {entry.cognome}</b>
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Sezione di destinazione</label>
          <select 
            className="input-modern w-full"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
          >
             <option value="">-- Seleziona --</option>
             {DB_SECTIONS.filter(s => s !== entry.section).map(s => (
                 <option key={s} value={s}>{getSectionLabel(s)}</option>
             ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className="btn btn-ghost bg-slate-50 hover:bg-slate-100 text-slate-600" onClick={onClose} disabled={loading}>Annulla</button>
          <button className="btn btn-brand" onClick={handleMove} disabled={!selectedSection || loading}>
            {loading ? "Spostamento..." : "Sposta Ora"}
          </button>
        </div>
      </div>
    </div>
  )
}
