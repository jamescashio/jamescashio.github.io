import { useId, type CSSProperties } from "react";

// Motion paths register to the owner's 3:1 artwork; they never replace the lettering.
const LETTERS = [
  "M223 140C177 117 147 145 147 182S178 237 222 218",
  "M239 245L327 51L416 245M273 181H381",
  "M512 139C469 117 435 139 444 159C453 180 513 168 521 197C529 226 477 235 439 220",
  "M556 224V88H568V159C592 120 651 126 651 180V224",
  "M699 241V68H727V241",
  "M865 181C865 118 764 118 764 181S865 245 865 181Z",
];
const CHANNELS = [
  ...LETTERS,
  "M42 154H106L129 177H147",
  "M83 128H129L149 109H207L217 121H239",
  "M83 205H119L139 221H162",
  "M865 162H895L920 151H974",
  "M863 200H895L914 216H962",
  "M852 131L884 106H925L939 103H971",
  "M241 142C246 38 413 34 431 131",
  "M262 241L285 187H303M408 241L383 192H350",
];
const GLYPHS = ["01<>λ{}∑/10:∂", "∇0xA7→{1}01", "10∑[0]λ:101", "{x}01/Δ>010"];

export type CircuitMode = "all" | "runners" | "code";

export function BrandCircuit({
  detailed,
  signal = 0,
  focusLetter,
}: {
  detailed: boolean;
  signal?: number;
  focusLetter?: number;
}) {
  const id = useId().replace(/:/g, "");
  const origin = [185, 327.5, 481, 610, 713, 815][focusLetter ?? 1];
  const relay = `M${origin} 184V263H327.5V207`;
  return (
    <svg className="cashio-circuit" viewBox="0 0 1000 333.333" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <mask id={`letters-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="334">
          <g stroke="white" strokeWidth="17" strokeLinejoin="round" strokeLinecap="round">
            {LETTERS.map((path) => (
              <path key={path} d={path} />
            ))}
          </g>
          <path d="M278 180H382" stroke="white" strokeWidth="22" />
          <path d="M304 160H351V207H304Z" fill="black" />
        </mask>
        <linearGradient id={`code-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#91ffc3" stopOpacity=".6" />
          <stop offset=".4" stopColor="#75fbc2" stopOpacity=".9" />
          <stop offset=".9" stopColor="#b4ffe3" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {detailed && (
        <g className="cashio-code" mask={`url(#letters-${id})`}>
          {Array.from({ length: 57 }, (_, index) => (
            <text
              key={index}
              x={142 + index * 13}
              y="25"
              fill={`url(#code-${id})`}
              className="cashio-code-column"
              style={{ "--duration": `${7 + (index % 7)}s`, "--delay": `${-(index * 1.71) % 12}s` } as CSSProperties}
            >
              {GLYPHS[index % GLYPHS.length].repeat(4)}
            </text>
          ))}
        </g>
      )}
      <g className="cashio-runners">
        {CHANNELS.map((path, index) => (
          <g
            key={path}
            className={`cashio-trace cashio-trace-${index % 3}`}
            style={{ "--duration": `${4.8 + (index % 5) * 0.63}s`, "--delay": `${-index * 0.89}s` } as CSSProperties}
          >
            <path className="cashio-trace-rail" d={path} />
            <path className="cashio-trace-tail" d={path} pathLength="100" />
            <path className="cashio-trace-head" d={path} pathLength="100" />
          </g>
        ))}
      </g>
      {detailed && focusLetter !== undefined && (
        <g className="cashio-selected-circuit">
          <path className="cashio-selection-halo" d={LETTERS[focusLetter]} />
          <path className="cashio-selection-edge" d={LETTERS[focusLetter]} />
          <path className="cashio-selection-conduit" d={relay} />
          <path className="cashio-selection-contact" d={`M${origin - 7} 263h14m-7-7v14`} />
        </g>
      )}
      {signal > 0 && (
        <g key={signal} className="cashio-command-pulse">
          <path className="cashio-origin-signal cashio-origin-glow" d={relay} pathLength="100" />
          <path className="cashio-origin-signal" d={relay} pathLength="100" />
          <circle cx="327.5" cy="184" r="31" className="cashio-ignition-ring" />
          <circle cx="327.5" cy="184" r="44" className="cashio-ignition-ring cashio-ignition-echo" />
          {CHANNELS.map((path, index) => (
            <path
              key={path}
              d={path}
              pathLength="100"
              className={`cashio-burst cashio-trace-${index % 3}`}
              style={{ "--burst-delay": `${0.65 + Math.abs(index - 1) * 0.055}s` } as CSSProperties}
            />
          ))}
          <circle cx="327.5" cy="184" r="42" className="cashio-burst-ring" />
        </g>
      )}
      <g className="cashio-chip-signal">
        <path d="M300 158h-12l-8-8v-13m72 21h13l8-8v-13M302 209h-16l-10 11m76-11h17l10 11" />
        <rect x="304" y="161" width="47" height="46" rx="3" />
        <circle cx="327.5" cy="184" r="42" className="cashio-core-wave" />
      </g>
    </svg>
  );
}
