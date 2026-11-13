// src/lib/agendaDeleteUtils.ts

export interface EntryToDelete {
  id: string;
  section?: string | null;
  client_id?: string | null;
  entry_date?: string | null;
  nome?: string | null;
  cognome?: string | null;
  telefono?: string | null;
}

export async function deleteEntryWithRinnoviSync(
  entryOrId: string | EntryToDelete,
  supabase: any,
  cachedEntry?: EntryToDelete | null
): Promise<boolean> {
  const id = typeof entryOrId === "string" ? entryOrId : entryOrId?.id;
  if (!id) return false;

  // 1. First confirmation: delete appointment from Agenda
  const confirmDelete = window.confirm("Sei sicuro di voler eliminare questo appuntamento dall'agenda?");
  if (!confirmDelete) return false;

  try {
    // 2. Fetch full entry details if not already present
    let entry: EntryToDelete | null = typeof entryOrId !== "string" ? entryOrId : (cachedEntry || null);

    if (!entry || !entry.section || entry.client_id === undefined) {
      const { data: fetched } = await supabase
        .from("entries")
        .select("id, section, client_id, entry_date, nome, cognome, telefono")
        .eq("id", id)
        .maybeSingle();
      if (fetched) {
        entry = fetched;
      }
    }

    const section = (entry?.section || "").toUpperCase();
    const clientId = entry?.client_id || null;
    const entryDate = entry?.entry_date || null;
    const isRinSection = section.includes("RINNOV") || section.includes("INTEGRAZION");

    // 3. Find any linked rinnovi_items records
    let linkedRinnoviIds: string[] = [];

    // Check exact entry_id match
    const { data: byEntryId } = await supabase
      .from("rinnovi_items")
      .select("id, client_id, mese_riferimento")
      .eq("entry_id", id);

    if (byEntryId && byEntryId.length > 0) {
      linkedRinnoviIds.push(...byEntryId.map((r: any) => r.id));
    }

    // If no direct entry_id match, but client_id is known and this is a Rinnovi section
    if (linkedRinnoviIds.length === 0 && clientId && isRinSection) {
      const { data: byClient } = await supabase
        .from("rinnovi_items")
        .select("id, client_id, mese_riferimento")
        .eq("client_id", clientId);

      if (byClient && byClient.length > 0) {
        const entryMonth = entryDate ? entryDate.slice(0, 7) : null;
        const matchingMonth = entryMonth ? byClient.filter((r: any) => r.mese_riferimento === entryMonth) : [];
        if (matchingMonth.length > 0) {
          linkedRinnoviIds.push(...matchingMonth.map((r: any) => r.id));
        } else {
          linkedRinnoviIds.push(...byClient.map((r: any) => r.id));
        }
      }
    }

    const isRinnoviRelated = isRinSection || linkedRinnoviIds.length > 0;

    // 4. If Rinnovi related, ask confirmation to reset status in Rinnovi campaign
    let shouldResetRinnovi = false;
    if (isRinnoviRelated) {
      shouldResetRinnovi = window.confirm(
        "Questo appuntamento è collegato alla campagna Rinnovi.\n\n" +
        "Vuoi resettare anche lo stato del cliente nella lista Rinnovi per riaverlo pulito (da contattare)?\n\n" +
        "• Premi OK per eliminare l'appuntamento e resettare lo stato nei Rinnovi.\n" +
        "• Premi Annulla per eliminare solo l'appuntamento dall'agenda mantenendo lo storico nei Rinnovi."
      );
    }

    // 5. Update rinnovi_items
    if (shouldResetRinnovi && linkedRinnoviIds.length > 0) {
      await supabase
        .from("rinnovi_items")
        .update({
          entry_id: null,
          preso_appuntamento: false,
          data_consulenza: null,
          consulenza_fatta: false,
          esito: null,
          nuovo_abbonamento_name: null,
          motivo_negativo: null,
          data_risposta: null,
          contattato: false,
        })
        .in("id", linkedRinnoviIds);
    } else {
      // Even if not resetting outcome, clear dangling entry_id
      await supabase
        .from("rinnovi_items")
        .update({ entry_id: null })
        .eq("entry_id", id);
    }

    // 6. Delete the appointment from entries table
    const { error: delErr } = await supabase.from("entries").delete().eq("id", id);
    if (delErr) {
      alert("Errore durante l'eliminazione dell'appuntamento: " + delErr.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Error in deleteEntryWithRinnoviSync:", err);
    alert("Errore imprevisto durante l'eliminazione: " + (err?.message || err));
    return false;
  }
}
