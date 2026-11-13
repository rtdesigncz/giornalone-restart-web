import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
    cleanPhoneTail,
    parsePassItemMeta,
    PassAgendaSync,
    SyncedOutcome,
    SyncedSlotInfo,
} from '@/lib/passUtils';

export const dynamic = 'force-dynamic';

function namesCompatible(aNome?: string | null, bNome?: string | null): boolean {
    const a = String(aNome || '').trim().toUpperCase();
    const b = String(bNome || '').trim().toUpperCase();
    if (!a || !b) return true;
    if (a === b) return true;
    const aFirst = a.split(/\s+/)[0];
    const bFirst = b.split(/\s+/)[0];
    return (aFirst.length >= 2 && aFirst === bFirst) || a.includes(b) || b.includes(a);
}

function doesEntryMatchReferral(entry: any, item: any, extraIds: Set<string>): boolean {
    if (
        entry.id &&
        (entry.id === item.id_app_1 ||
            entry.id === item.id_app_2 ||
            entry.id === item.id_app_3 ||
            extraIds.has(entry.id))
    ) {
        return true;
    }

    const rPhone = cleanPhoneTail(item.referral_telefono);
    const ePhone = cleanPhoneTail(entry.telefono);
    const rNome = String(item.referral_nome || '').trim().toUpperCase();
    const rCognome = String(item.referral_cognome || '').trim().toUpperCase();
    const eNome = String(entry.nome || '').trim().toUpperCase();
    const eCognome = String(entry.cognome || '').trim().toUpperCase();

    if (rPhone.length >= 9 && ePhone.length >= 9 && rPhone === ePhone) {
        return namesCompatible(eNome, rNome);
    }

    if (rNome.length >= 2 && rCognome.length >= 2 && eNome === rNome && eCognome === rCognome) {
        if (rPhone.length >= 9 && ePhone.length >= 9 && rPhone !== ePhone) return false;
        return true;
    }

    return false;
}

function deriveEntryOutcome(entry: any, fallbackManual?: string | null): SyncedOutcome {
    if (entry) {
        if (entry.venduto || entry.presentato) return 'show';
        if (entry.assente || entry.miss) return 'no_show';
    }
    if (fallbackManual === 'show' || fallbackManual === 'no_show') {
        return fallbackManual;
    }
    return 'pending';
}

function extractRelationName(rel: any): string | null {
    if (!rel) return null;
    if (Array.isArray(rel)) return rel[0]?.name || null;
    return rel.name || null;
}

const TRIAL_SECTIONS = new Set([
    'APPUNTAMENTI (Pianificazione)',
    'TOUR SPONTANEI',
    'MISS CON APPUNTAMENTO',
]);

export async function GET(req: Request) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { searchParams } = new URL(req.url);
    const gestioneId = searchParams.get('gestione');
    if (!gestioneId) return NextResponse.json({ rows: [] });

    const { data: rows, error } = await supabase
        .from('pass_items')
        .select('*')
        .eq('gestione_id', gestioneId)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows || rows.length === 0) return NextResponse.json({ rows: [] });

    const leadItems = rows.filter((r) => r.is_lead);
    if (leadItems.length === 0) {
        return NextResponse.json({ rows });
    }

    let minDate = '2025-08-01';
    const candidateDates = leadItems
        .flatMap((r) => [r.data_consegna, r.data_attivazione, r.data_app_1])
        .filter(Boolean)
        .map((d: string) => d.slice(0, 10))
        .sort();

    if (candidateDates.length > 0) {
        const d = new Date(candidateDates[0] + 'T00:00:00');
        if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() - 14);
            minDate = d.toISOString().slice(0, 10);
        }
    }

    // Fetch all relevant entries handling Supabase 1000-row max_rows pagination cleanly
    const entriesData: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    while (from < 15000) {
        const { data: pageRows, error: pageErr } = await supabase
            .from('entries')
            .select('id, entry_date, entry_time, section, nome, cognome, telefono, presentato, assente, miss, negativo, venduto, note, tipi_abbonamento(name), consulenti(name)')
            .gte('entry_date', minDate)
            .order('entry_date', { ascending: true })
            .order('entry_time', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (pageErr) {
            console.warn('Agenda sync pagination error:', pageErr.message);
            break;
        }
        if (!pageRows || pageRows.length === 0) break;
        entriesData.push(...pageRows);
        if (pageRows.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    const enrichedRows = rows.map((item) => {
        if (!item.is_lead) {
            return { ...item, agenda_sync: null };
        }

        const meta = parsePassItemMeta(item.note);
        const extraIds = new Set<string>(
            (meta.extra_apps || []).map((a) => a.entry_id).filter(Boolean) as string[]
        );

        const personEntries = entriesData.filter((e) => doesEntryMatchReferral(e, item, extraIds));
        const actDate = (item.data_attivazione || item.data_consegna || minDate).slice(0, 10);
        const postActivationEntries = personEntries.filter((e) => e.entry_date >= actDate);

        // Identify sale (from a saved pass entry OR from initial Pianificazione/Miss/Tour right after activation)
        const savedIds = new Set<string>(
            [item.id_app_1, item.id_app_2, item.id_app_3, ...(meta.extra_apps || []).map((a) => a.entry_id)].filter(Boolean) as string[]
        );

        const soldEntry = postActivationEntries
            .filter(
                (e) =>
                    e.venduto &&
                    (savedIds.has(e.id) ||
                        TRIAL_SECTIONS.has(e.section) ||
                        (e.note || '').toUpperCase().includes('REFERRAL DI'))
            )
            .sort((a, b) => (a.entry_date > b.entry_date ? 1 : -1))[0];

        const soldDate = soldEntry?.entry_date || null;

        // Build map of explicitly saved slots (1..3 from columns + 4+ from meta.extra_apps)
        const savedByStep = new Map<
            number,
            { date: string | null; esito: string | null; entry_id: string | null }
        >();
        for (const step of [1, 2, 3]) {
            const d = item[`data_app_${step}`]?.slice(0, 10) || null;
            const id = item[`id_app_${step}`] || null;
            const esito = item[`esito_app_${step}`] || null;
            if (d || id) {
                savedByStep.set(step, { date: d, esito, entry_id: id });
            }
        }
        if (meta.extra_apps) {
            for (const ex of meta.extra_apps) {
                savedByStep.set(ex.step, {
                    date: ex.date,
                    esito: ex.esito,
                    entry_id: ex.entry_id || null,
                });
            }
        }

        const usedEntryIds = new Set<string>();
        const trials: SyncedSlotInfo[] = [];

        // 1. Sync statuses ONLY for appointments explicitly linked to Pass slots
        for (const [step, saved] of savedByStep.entries()) {
            let matchedEntry: any = null;
            if (saved.entry_id) {
                matchedEntry = personEntries.find((e) => e.id === saved.entry_id) || null;
            }
            if (!matchedEntry && saved.date) {
                matchedEntry =
                    personEntries.find(
                        (e) =>
                            e.entry_date === saved.date &&
                            !usedEntryIds.has(e.id) &&
                            (TRIAL_SECTIONS.has(e.section) ||
                                (e.note || '').toUpperCase().includes('REFERRAL DI'))
                    ) || null;
            }
            if (matchedEntry?.id) usedEntryIds.add(matchedEntry.id);

            trials.push({
                step,
                entry_id: matchedEntry?.id || saved.entry_id || null,
                date: saved.date || matchedEntry?.entry_date || null,
                time: matchedEntry?.entry_time ? matchedEntry.entry_time.slice(0, 5) : null,
                status: deriveEntryOutcome(matchedEntry, saved.esito),
                consulente: extractRelationName(matchedEntry?.consulenti),
                venduto: Boolean(matchedEntry?.venduto),
                negativo: Boolean(matchedEntry?.negativo),
                tipo_abbonamento: extractRelationName(matchedEntry?.tipi_abbonamento),
            });
        }

        // 2. STRICT Miss-reschedule / explicit Pass discovery ONLY:
        //    - NEVER add any new slots if the prospect is already enrolled (item.iscritto) or after soldDate!
        //    - NEVER grab unrelated sections or manual non-pass appointments: ONLY entries explicitly created as "REFERRAL DI" (or their MISS reschedules)!
        const isAlreadyEnrolled = Boolean(item.iscritto);
        if (!isAlreadyEnrolled) {
            const explicitPassReschedules = postActivationEntries.filter((e) => {
                if (usedEntryIds.has(e.id)) return false;
                if (soldDate && e.entry_date > soldDate) return false;
                const noteUpper = (e.note || '').toUpperCase();
                return noteUpper.includes('REFERRAL DI') && TRIAL_SECTIONS.has(e.section);
            });

            const usedSteps = new Set(trials.map((t) => t.step));
            let nextStep = 1;

            for (const cand of explicitPassReschedules) {
                if (trials.some((t) => t.date === cand.entry_date)) {
                    continue;
                }
                while (usedSteps.has(nextStep)) {
                    nextStep++;
                }
                usedSteps.add(nextStep);
                trials.push({
                    step: nextStep,
                    entry_id: cand.id,
                    date: cand.entry_date,
                    time: cand.entry_time ? cand.entry_time.slice(0, 5) : null,
                    status: deriveEntryOutcome(cand, null),
                    consulente: extractRelationName(cand.consulenti),
                    venduto: Boolean(cand.venduto),
                    negativo: Boolean(cand.negativo),
                    tipo_abbonamento: extractRelationName(cand.tipi_abbonamento),
                });
                nextStep++;
            }
        }

        trials.sort((a, b) => a.step - b.step);

        const showDates = trials
            .filter((s) => s.status === 'show' && s.date)
            .map((s) => s.date as string)
            .sort();

        // Check negative outcome ONLY on linked pass entries or pre-sale TRIAL_SECTIONS
        const negEntry = !soldEntry && !isAlreadyEnrolled
            ? postActivationEntries
                  .filter(
                      (e) =>
                          e.negativo &&
                          !e.venduto &&
                          (usedEntryIds.has(e.id) ||
                              (e.note || '').toUpperCase().includes('REFERRAL DI') ||
                              e.section === 'APPUNTAMENTI (Pianificazione)')
                  )
                  .sort((a, b) => (a.entry_date > b.entry_date ? -1 : 1))[0]
            : null;

        const anyNoShowInSlots = trials.some((s) => s.status === 'no_show');
        const chronologicalTrials = [...trials]
            .filter((t) => t.date)
            .sort((a, b) => ((a.date || '') > (b.date || '') ? 1 : -1));
        const hasUnrecoveredNoShow = chronologicalTrials.some((t, idx) => {
            if (t.status !== 'no_show') return false;
            return !chronologicalTrials.slice(idx + 1).some((later) => (later.date || '') >= (t.date || ''));
        });

        const firstShowDate = showDates[0] || null;

        const agendaSync: PassAgendaSync = {
            trials,
            has_any_show: showDates.length > 0,
            has_any_no_show: anyNoShowInSlots,
            has_unrecovered_no_show: hasUnrecoveredNoShow,
            first_show_date: firstShowDate,
            sold_in_agenda: Boolean(soldEntry),
            sold_date: soldEntry?.entry_date || null,
            sold_abbonamento: extractRelationName(soldEntry?.tipi_abbonamento),
            sold_consulente: extractRelationName(soldEntry?.consulenti),
            negativo_in_agenda: Boolean(negEntry),
            negativo_date: negEntry?.entry_date || null,
        };

        return {
            ...item,
            agenda_sync: agendaSync,
        };
    });

    return NextResponse.json({ rows: enrichedRows });
}

export async function POST(req: Request) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await req.json();
    if (body.cliente_nome) body.cliente_nome = String(body.cliente_nome).trim().toUpperCase();
    if (body.cliente_cognome) body.cliente_cognome = String(body.cliente_cognome).trim().toUpperCase();
    if (body.referral_nome) body.referral_nome = String(body.referral_nome).trim().toUpperCase();
    if (body.referral_cognome) body.referral_cognome = String(body.referral_cognome).trim().toUpperCase();

    const { data: row, error } = await supabase.from('pass_items').insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ row });
}

export async function PATCH(req: Request) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body = await req.json();
    if (body.cliente_nome) body.cliente_nome = String(body.cliente_nome).trim().toUpperCase();
    if (body.cliente_cognome) body.cliente_cognome = String(body.cliente_cognome).trim().toUpperCase();
    if (body.referral_nome) body.referral_nome = String(body.referral_nome).trim().toUpperCase();
    if (body.referral_cognome) body.referral_cognome = String(body.referral_cognome).trim().toUpperCase();

    const { error } = await supabase.from('pass_items').update(body).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { error } = await supabase.from('pass_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
