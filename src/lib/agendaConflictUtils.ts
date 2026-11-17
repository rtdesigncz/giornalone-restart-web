// src/lib/agendaConflictUtils.ts

/**
 * Converte una stringa orario (es. "10:30", "10:30:00") in minuti trascorsi dalla mezzanotte.
 * Restituisce null se il formato non è valido.
 */
export function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Converte i minuti trascorsi dalla mezzanotte in una stringa HH:MM.
 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface ExistingAppointmentEntry {
  id: string;
  entry_time: string | null;
  section?: string | null;
  nome?: string | null;
  cognome?: string | null;
  consulente_id?: string | null;
}

export interface ConflictItem {
  id: string;
  entry_time: string;
  section: string;
  nome?: string;
  cognome?: string;
  diffMinutes: number;
}

/**
 * Rileva eventuali sovrapposizioni orarie per lo stesso consulente.
 * Considera una durata standard prefissata (default 20 minuti).
 * Due appuntamenti si sovrappongono se: Math.abs(inizio1 - inizio2) < durata.
 */
export function checkConflicts({
  currentTime,
  currentEntryId,
  existingEntries,
  durationMinutes = 20,
}: {
  currentTime: string | null | undefined;
  currentEntryId?: string | null;
  existingEntries: ExistingAppointmentEntry[];
  durationMinutes?: number;
}): ConflictItem[] {
  const currentMins = timeToMinutes(currentTime);
  if (currentMins === null) return [];

  const conflicts: ConflictItem[] = [];

  for (const entry of existingEntries) {
    // Escludi l'appuntamento stesso se siamo in modifica
    if (currentEntryId && entry.id === currentEntryId) continue;

    // Se l'appuntamento non ha un orario valido, ignora
    if (!entry.entry_time) continue;

    // Tour spontanei non hanno prenotazione oraria fissa
    if (entry.section === "TOUR SPONTANEI") continue;

    const entryMins = timeToMinutes(entry.entry_time);
    if (entryMins === null) continue;

    const diff = Math.abs(currentMins - entryMins);
    if (diff < durationMinutes) {
      conflicts.push({
        id: entry.id,
        entry_time: entry.entry_time.slice(0, 5),
        section: entry.section || "",
        nome: entry.nome || "",
        cognome: entry.cognome || "",
        diffMinutes: diff,
      });
    }
  }

  return conflicts;
}

/**
 * Suggerisce fino a maxSuggestions slot liberi vicini all'orario richiesto
 * che non vadano in conflitto con gli altri appuntamenti del consulente.
 */
export function suggestAvailableSlots({
  currentTime,
  currentEntryId,
  existingEntries,
  durationMinutes = 20,
  maxSuggestions = 3,
}: {
  currentTime: string | null | undefined;
  currentEntryId?: string | null;
  existingEntries: ExistingAppointmentEntry[];
  durationMinutes?: number;
  maxSuggestions?: number;
}): string[] {
  const currentMins = timeToMinutes(currentTime);
  if (currentMins === null) return [];

  // Calcola gli intervalli già occupati [start, end)
  const bookedIntervals = existingEntries
    .filter((e) => (!currentEntryId || e.id !== currentEntryId) && e.entry_time && e.section !== "TOUR SPONTANEI")
    .map((e) => {
      const m = timeToMinutes(e.entry_time);
      return m !== null ? { start: m, end: m + durationMinutes } : null;
    })
    .filter((x): x is { start: number; end: number } => x !== null);

  const isSlotFree = (slotMins: number) => {
    const slotEnd = slotMins + durationMinutes;
    return !bookedIntervals.some((b) => slotMins < b.end && b.start < slotEnd);
  };

  const suggestions: string[] = [];
  // Prova offset successivi e precedenti a passi di 20 minuti
  const offsets = [20, -20, 40, -40, 60, -60, 80, -80, 100, -100, 120, -120];

  for (const offset of offsets) {
    const candidate = currentMins + offset;
    // Fascia oraria d'apertura standard: 07:00 (420 min) - 22:00 (1320 min)
    if (candidate >= 420 && candidate <= 1320) {
      if (isSlotFree(candidate)) {
        const timeStr = minutesToTime(candidate);
        if (!suggestions.includes(timeStr)) {
          suggestions.push(timeStr);
          if (suggestions.length >= maxSuggestions) break;
        }
      }
    }
  }

  return suggestions.sort();
}
