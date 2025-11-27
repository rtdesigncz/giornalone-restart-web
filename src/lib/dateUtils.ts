
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "";
    // Handle YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateString.split("-");
        return `${d}-${m}-${y}`;
    }
    // Handle ISO strings or other formats if needed, but for now our DB uses YYYY-MM-DD
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    } catch {
        return dateString;
    }
}
