/** A single navigational instrument around Bit. The parent button owns interaction. */
export function HeroSignal() {
  return (
    <span className="ah-signal" aria-hidden="true">
      <svg className="ah-signal-frame" viewBox="0 0 260 260" fill="none">
        <circle cx="130" cy="130" r="112" stroke="currentColor" strokeWidth=".7" strokeDasharray="110 18 7 18" />
        <path d="M18 130h10m204 0h10M130 18v10m0 204v10" stroke="currentColor" strokeWidth="1" />
        <circle cx="130" cy="130" r="95" stroke="currentColor" strokeWidth=".5" opacity=".3" />
      </svg>
      <svg className="ah-signal-tracker" viewBox="0 0 260 260" fill="none">
        <path d="M130 18a112 112 0 0 1 97 56" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="227" cy="74" r="3" fill="currentColor" />
        <path d="M130 242a112 112 0 0 1-97-56" stroke="currentColor" strokeWidth="1" opacity=".55" />
        <circle cx="33" cy="186" r="2" fill="currentColor" />
      </svg>
      <span className="ah-signal-charge" />
    </span>
  );
}
