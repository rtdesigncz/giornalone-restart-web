"use client";

export default function AddRowTrigger({
  section,
  isDay,
}: {
  section: string;
  isDay: boolean;
}) {
  if (!isDay) return null;

  const onClick = () => {
    window.dispatchEvent(new CustomEvent("add-draft", { detail: { section } }));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded border"
      style={{ backgroundColor: "#1AB4B8", color: "white" }}
      aria-label="Aggiungi riga"
      title="Aggiungi riga"
    >
      + Aggiungi Riga
    </button>
  );
}
