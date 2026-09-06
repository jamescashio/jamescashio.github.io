/** A single navigational instrument around Bit. The parent button owns interaction. */
export function HeroSignal() {
  return (
    <span className="ah-signal" aria-hidden="true">
      <svg className="ah-signal-frame" viewBox="0 0 260 260" fill="none">
        <circle cx="130" cy="130" r="112" stroke="currentColor" strokeWidth=".7" strokeDasharray="110 18 7 18" />
        <path d="M18 130h10m204 0h10M130 18v10m0 204v10" stroke="currentColor" strokeWidth="1" />
        <circle cx="130" cy="130" r="95" stroke="currentColor" strokeWidth=".5" opacity=".3" />
        {Array.from({ length: 36 }, (_, index) => (
          <path
            key={index}
            d={index % 3 === 0 ? "M130 5v9" : "M130 7v4"}
            transform={`rotate(${index * 10} 130 130)`}
            stroke="currentColor"
            strokeWidth={index % 3 === 0 ? 1.2 : 0.6}
            opacity={index % 3 === 0 ? 0.8 : 0.4}
          />
        ))}
      </svg>
      <svg className="lf-core-orbits" viewBox="0 0 260 260" fill="none">
        <g className="lf-core-orbit-a">
          <ellipse cx="130" cy="130" rx="118" ry="57" stroke="currentColor" strokeWidth=".8" />
          <path d="M12 130a118 57 0 0 1 118-57" stroke="#b7ffff" strokeWidth="2" />
          <circle cx="130" cy="73" r="3" fill="#d5ffff" />
        </g>
        <g className="lf-core-orbit-b">
          <ellipse cx="130" cy="130" rx="116" ry="53" stroke="#edc991" strokeWidth=".6" />
          <path d="M246 130a116 53 0 0 1-116 53" stroke="#ffd9a4" strokeWidth="1.6" />
          <circle cx="130" cy="183" r="2.5" fill="#ffe5b8" />
        </g>
      </svg>
      <svg className="ah-signal-tracker" viewBox="0 0 260 260" fill="none">
        <path d="M130 18a112 112 0 0 1 97 56" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="227" cy="74" r="3" fill="currentColor" />
        <path d="M130 242a112 112 0 0 1-97-56" stroke="currentColor" strokeWidth="1" opacity=".55" />
        <circle cx="33" cy="186" r="2" fill="currentColor" />
      </svg>
      <svg className="lf-lock-brackets" viewBox="0 0 260 260" fill="none">
        <path d="M84 65H65v19m111-19h19v19M65 176v19h19m111-19v19h-19" stroke="#ffe0ae" strokeWidth="1.5" />
        <path d="M130 54v11m65 65h11m-76 65v11m-76-76h11" stroke="#c2ffff" strokeWidth="1" />
      </svg>
      <span className="ah-signal-charge" />
      <span className="lf-core-wave lf-core-wave-a" />
      <span className="lf-core-wave lf-core-wave-b" />
    </span>
  );
}
