// src/components/SpinnerDots.tsx
export default function SpinnerDots({ inline = true }: { inline?: boolean }) {
  return (
    <span className={`spinner-dots ${inline ? "" : "block"}`} aria-label="Caricamento">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}