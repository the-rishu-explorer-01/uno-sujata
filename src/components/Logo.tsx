/** Placeholder wordmark. Replace with the approved logo SVG when available. */
export default function Logo({ inverted = false }: { inverted?: boolean }) {
  const color = inverted ? "text-bone" : "text-ink";
  return (
    <span className={`flex items-center gap-3 ${color}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="14" cy="14" r="6" fill="none" stroke="#A9834A" strokeWidth="2" />
        <path d="M14 1v5M14 22v5M1 14h5M22 14h5" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="font-display text-[15px] font-bold tracking-[0.18em]">UNO SUJATA</span>
    </span>
  );
}
