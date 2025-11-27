// src/components/SectionTableShell.tsx
export default function SectionTableShell({
  title,
  children,
  onAdd,
  headerBg = "#1AB4B8", // default brand
  headerText = "#ffffff",
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  headerBg?: string;
  headerText?: string;
}) {
  return (
    <section className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 lg:px-6 py-3"
        style={{ background: headerBg, color: headerText }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          className="btn btn-ghost bg-white/10 text-white border-white/20 hover:bg-white/20"
          onClick={onAdd}
        >
          + Aggiungi riga
        </button>
      </div>
      <div className="bg-white px-2 lg:px-4 pb-4">
        {children}
      </div>
    </section>
  );
}