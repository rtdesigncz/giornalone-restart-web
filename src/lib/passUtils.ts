// src/lib/passUtils.ts

export interface PassStrategy {
  strategy_type: "free" | "paid";
  price: number;
  /** Number of expected trials. 0 means unlimited/dynamic. */
  trials_count: number;
  proposal_after_days: number;
}

export const DEFAULT_PASS_STRATEGY: PassStrategy = {
  strategy_type: "free",
  price: 0,
  trials_count: 3,
  proposal_after_days: 2,
};

export function parsePassStrategy(descrizione?: string | null): PassStrategy {
  if (!descrizione || typeof descrizione !== "string") {
    return { ...DEFAULT_PASS_STRATEGY };
  }
  const trimmed = descrizione.trim();
  if (!trimmed.startsWith("{")) {
    return { ...DEFAULT_PASS_STRATEGY };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const rawCount = Number(parsed.trials_count);
    const validCount =
      !isNaN(rawCount) && rawCount >= 0 && Number.isInteger(rawCount) ? rawCount : 3;

    return {
      strategy_type: parsed.strategy_type === "paid" ? "paid" : "free",
      price: typeof parsed.price === "number" && parsed.price >= 0 ? parsed.price : 0,
      trials_count: validCount,
      proposal_after_days:
        typeof parsed.proposal_after_days === "number" && parsed.proposal_after_days >= 0
          ? parsed.proposal_after_days
          : 2,
    };
  } catch {
    return { ...DEFAULT_PASS_STRATEGY };
  }
}

export function serializePassStrategy(strategy: PassStrategy): string {
  const count =
    typeof strategy.trials_count === "number" && strategy.trials_count >= 0
      ? Math.floor(strategy.trials_count)
      : 3;

  return JSON.stringify({
    strategy_type: strategy.strategy_type,
    price: strategy.strategy_type === "paid" ? Number(strategy.price) || 0 : 0,
    trials_count: count,
    proposal_after_days: strategy.proposal_after_days,
  });
}

export type SyncedOutcome = "pending" | "show" | "no_show";

export interface ExtraTrialSlot {
  step: number; // >= 4
  date: string;
  esito: SyncedOutcome;
  entry_id?: string | null;
}

export type ProposalStatus = "pending" | "ready" | "made" | "accepted" | "declined";

export interface PassItemMeta {
  paid: boolean;
  paid_amount?: number;
  paid_date?: string | null;
  proposal_status?: ProposalStatus;
  proposal_date?: string | null;
  decline_reason?: string | null;
  text?: string | null;
  extra_apps?: ExtraTrialSlot[];
}

export function parsePassItemMeta(note?: string | null): PassItemMeta {
  if (!note || typeof note !== "string") {
    return { paid: false };
  }
  const trimmed = note.trim();
  if (!trimmed.startsWith("{")) {
    return { paid: false, text: trimmed || null };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const extraApps: ExtraTrialSlot[] = Array.isArray(parsed.extra_apps)
      ? parsed.extra_apps
          .filter((a: any) => a && typeof a.step === "number" && a.date)
          .map((a: any) => ({
            step: Number(a.step),
            date: String(a.date).slice(0, 10),
            esito: a.esito === "show" || a.esito === "no_show" ? a.esito : "pending",
            entry_id: a.entry_id || null,
          }))
          .sort((a: ExtraTrialSlot, b: ExtraTrialSlot) => a.step - b.step)
      : [];

    return {
      paid: Boolean(parsed.paid),
      paid_amount: typeof parsed.paid_amount === "number" ? parsed.paid_amount : undefined,
      paid_date: parsed.paid_date || null,
      proposal_status: parsed.proposal_status || undefined,
      proposal_date: parsed.proposal_date || null,
      decline_reason: parsed.decline_reason || null,
      text: parsed.text || null,
      extra_apps: extraApps.length > 0 ? extraApps : undefined,
    };
  } catch {
    return { paid: false, text: trimmed };
  }
}

export function serializePassItemMeta(meta: PassItemMeta): string | null {
  const clean: Record<string, any> = {};
  if (meta.paid) clean.paid = true;
  if (typeof meta.paid_amount === "number" && meta.paid_amount > 0) clean.paid_amount = meta.paid_amount;
  if (meta.paid_date) clean.paid_date = meta.paid_date;
  if (meta.proposal_status) clean.proposal_status = meta.proposal_status;
  if (meta.proposal_date) clean.proposal_date = meta.proposal_date;
  if (meta.decline_reason) clean.decline_reason = meta.decline_reason;
  if (meta.text && meta.text.trim()) clean.text = meta.text.trim();
  if (meta.extra_apps && meta.extra_apps.length > 0) {
    clean.extra_apps = [...meta.extra_apps].sort((a, b) => a.step - b.step);
  }

  if (Object.keys(clean).length === 0) return null;
  return JSON.stringify(clean);
}

export function upsertExtraApp(meta: PassItemMeta, slot: ExtraTrialSlot): PassItemMeta {
  const existing = meta.extra_apps ? [...meta.extra_apps] : [];
  const idx = existing.findIndex((x) => x.step === slot.step);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...slot };
  } else {
    existing.push(slot);
  }
  return {
    ...meta,
    extra_apps: existing.sort((a, b) => a.step - b.step),
  };
}

export function removeExtraApp(meta: PassItemMeta, step: number): PassItemMeta {
  const existing = meta.extra_apps ? meta.extra_apps.filter((x) => x.step !== step) : [];
  return {
    ...meta,
    extra_apps: existing.length > 0 ? existing : undefined,
  };
}

export interface SyncedSlotInfo {
  step: number;
  entry_id?: string | null;
  date?: string | null;
  time?: string | null;
  status: SyncedOutcome;
  consulente?: string | null;
  venduto?: boolean;
  negativo?: boolean;
  tipo_abbonamento?: string | null;
}

export interface PassAgendaSync {
  trials: SyncedSlotInfo[];
  has_any_show: boolean;
  has_any_no_show: boolean;
  has_unrecovered_no_show: boolean;
  first_show_date: string | null;
  sold_in_agenda: boolean;
  sold_date: string | null;
  sold_abbonamento: string | null;
  sold_consulente: string | null;
  negativo_in_agenda: boolean;
  negativo_date: string | null;
}

export type EffectiveProposalPhase =
  | "accepted"
  | "declined"
  | "made"
  | "urgent_proposal"
  | "ready_proposal"
  | "waiting_trial";

export interface ProposalStateResult {
  phase: EffectiveProposalPhase;
  daysSinceFirstShow: number | null;
  firstShowDate: string | null;
}

export function getDaysDiffFromToday(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr.slice(0, 10) + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

export interface PassItemLike {
  iscritto?: boolean | null;
  esito_app_1?: string | null;
  esito_app_2?: string | null;
  esito_app_3?: string | null;
  id_app_1?: string | null;
  id_app_2?: string | null;
  id_app_3?: string | null;
  data_app_1?: string | null;
  data_app_2?: string | null;
  data_app_3?: string | null;
  note?: string | null;
  agenda_sync?: PassAgendaSync | null;
}

/**
 * Merges fixed columns (1..3), meta.extra_apps (>=4), and live agenda_sync.trials into a unified ordered trial list.
 */
export function getUnifiedTrials(item: PassItemLike): SyncedSlotInfo[] {
  const meta = parsePassItemMeta(item.note);
  const syncMap = new Map<number, SyncedSlotInfo>();

  if (item.agenda_sync?.trials) {
    for (const s of item.agenda_sync.trials) {
      syncMap.set(s.step, s);
    }
  }

  const maxStepFromMeta = meta.extra_apps?.reduce((m, a) => Math.max(m, a.step), 0) || 0;
  const maxStepFromSync = item.agenda_sync?.trials?.reduce((m, a) => Math.max(m, a.step), 0) || 0;
  const maxStep = Math.max(3, maxStepFromMeta, maxStepFromSync);

  const result: SyncedSlotInfo[] = [];

  for (let step = 1; step <= maxStep; step++) {
    const syncSlot = syncMap.get(step);
    let localDate: string | null = null;
    let localEsito: SyncedOutcome | null = null;
    let localId: string | null = null;

    if (step === 1) {
      localDate = item.data_app_1?.slice(0, 10) || null;
      localEsito = (item.esito_app_1 as SyncedOutcome) || null;
      localId = item.id_app_1 || null;
    } else if (step === 2) {
      localDate = item.data_app_2?.slice(0, 10) || null;
      localEsito = (item.esito_app_2 as SyncedOutcome) || null;
      localId = item.id_app_2 || null;
    } else if (step === 3) {
      localDate = item.data_app_3?.slice(0, 10) || null;
      localEsito = (item.esito_app_3 as SyncedOutcome) || null;
      localId = item.id_app_3 || null;
    } else {
      const extra = meta.extra_apps?.find((a) => a.step === step);
      if (extra) {
        localDate = extra.date;
        localEsito = extra.esito;
        localId = extra.entry_id || null;
      }
    }

    const effectiveDate = localDate || syncSlot?.date || null;
    if (!effectiveDate && !syncSlot) continue;

    // Prefer non-pending status from agenda_sync if available, else local
    const effectiveStatus: SyncedOutcome =
      syncSlot?.status && syncSlot.status !== "pending"
        ? syncSlot.status
        : localEsito === "show" || localEsito === "no_show"
          ? localEsito
          : syncSlot?.status || "pending";

    result.push({
      step,
      entry_id: localId || syncSlot?.entry_id || null,
      date: effectiveDate,
      time: syncSlot?.time || null,
      status: effectiveStatus,
      consulente: syncSlot?.consulente || null,
      venduto: syncSlot?.venduto,
      negativo: syncSlot?.negativo,
      tipo_abbonamento: syncSlot?.tipo_abbonamento || null,
    });
  }

  return result.sort((a, b) => a.step - b.step);
}

export function getEffectiveProposalState(
  item: PassItemLike,
  strategy: PassStrategy
): ProposalStateResult {
  const meta = parsePassItemMeta(item.note);
  const sync = item.agenda_sync;
  const unifiedTrials = getUnifiedTrials(item);

  const isSold = Boolean(item.iscritto || sync?.sold_in_agenda);
  if (isSold) {
    const firstShow = sync?.first_show_date || unifiedTrials.find((t) => t.status === "show")?.date || item.data_app_1 || null;
    return {
      phase: "accepted",
      daysSinceFirstShow: getDaysDiffFromToday(firstShow),
      firstShowDate: firstShow,
    };
  }

  const isDeclined = meta.proposal_status === "declined" || Boolean(sync?.negativo_in_agenda);
  if (isDeclined) {
    const firstShow = sync?.first_show_date || unifiedTrials.find((t) => t.status === "show")?.date || item.data_app_1 || null;
    return {
      phase: "declined",
      daysSinceFirstShow: getDaysDiffFromToday(firstShow),
      firstShowDate: firstShow,
    };
  }

  const showTrials = unifiedTrials.filter((t) => t.status === "show" && t.date);
  const firstShowDate =
    sync?.first_show_date ||
    (showTrials.length > 0 ? [...showTrials].sort((a, b) => (a.date! > b.date! ? 1 : -1))[0].date || null : null);

  if (meta.proposal_status === "made") {
    return {
      phase: "made",
      daysSinceFirstShow: getDaysDiffFromToday(firstShowDate),
      firstShowDate,
    };
  }

  if (showTrials.length > 0 || sync?.has_any_show) {
    const days = getDaysDiffFromToday(firstShowDate);
    if (days !== null && days >= strategy.proposal_after_days) {
      return {
        phase: "urgent_proposal",
        daysSinceFirstShow: days,
        firstShowDate,
      };
    }
    return {
      phase: "ready_proposal",
      daysSinceFirstShow: days,
      firstShowDate,
    };
  }

  return {
    phase: "waiting_trial",
    daysSinceFirstShow: null,
    firstShowDate: null,
  };
}

export function cleanPhoneTail(phone?: string | null): string {
  return String(phone || "").replace(/[^0-9]/g, "").slice(-9);
}
