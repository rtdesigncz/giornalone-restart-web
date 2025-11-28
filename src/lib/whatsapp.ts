import { supabase } from "./supabaseClient";

export interface WhatsAppEntry {
    id: string;
    nome: string;
    telefono: string | null;
    section: string;
    entry_date: string;
    entry_time: string | null;
    consulente?: { name: string } | null;
    whatsapp_sent?: boolean;
}

export const cleanPhone = (raw?: string | null) => {
    if (!raw) return "";
    let n = raw.replace(/[^\d+]/g, "");
    if (!n.startsWith("+")) {
        if (n.startsWith("00")) n = "+" + n.slice(2);
        else n = "+39" + n;
    }
    return n;
};

export const toHHMM = (t: string | null) => t?.slice(0, 5) || "";

export const getWhatsAppLink = (row: WhatsAppEntry) => {
    const tel = cleanPhone(row.telefono);
    if (!tel) return "";

    // Logic for 'TOUR SPONTANEI' and 'APPUNTAMENTI TELEFONICI' - just open chat
    if (row.section === "TOUR SPONTANEI") {
        return `https://wa.me/${tel}`;
    }

    const dateIT = new Date(row.entry_date).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    const msg = `Ciao ${row.nome}, ti ricordiamo l'appuntamento del ${dateIT} alle ${toHHMM(row.entry_time)} con ${row.consulente?.name || "noi"}. Ti aspettiamo!`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
};

export const markWhatsAppSent = async (id: string) => {
    const { error } = await supabase
        .from("entries")
        .update({ whatsapp_sent: true })
        .eq("id", id);

    if (error) {
        console.error("Error marking WhatsApp as sent:", error);
        return false;
    }
    return true;
};
