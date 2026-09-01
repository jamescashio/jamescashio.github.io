import { EXPIRES_SHORT, PVE, VERIFIED_LONG } from "@/lib/content";
import { IDENTITY_LINE } from "./decks";

export function ExecutiveStill({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LinkedIn executive still"
      data-still="armed"
      className="za-still"
      onClick={onClose}
    >
      <p className="za-still-hint za-mono" id="za-still-hint" onClick={(event) => event.stopPropagation()}>
        <span className="za-lock-pip" aria-hidden />
        SCREENSHOT THIS FRAME · LINKEDIN 1.91:1 · ESC TO EXIT
      </p>
      <article className="za-still-plate" aria-describedby="za-still-hint" onClick={(event) => event.stopPropagation()}>
        <span className="za-lcars-cap warm za-still-cap-tl">ZA</span>
        <span className="za-lcars-cap cool za-still-cap-br">CASHIO.US</span>
        <span className="za-still-rail top" aria-hidden />
        <span className="za-still-rail bottom" aria-hidden />
        <span className="za-still-grid" aria-hidden />
        <p className="za-kicker">ZEUSAPOLLO · DATED EXPORT · HUMAN COMMAND</p>
        <p className="za-mono za-still-id">{IDENTITY_LINE}</p>
        <h1 className="za-display za-still-title">
          OWN THE IRON
          <span>
            AND THE <span className="za-shimmer-text">ROUTE</span>.
          </span>
        </h1>
        <p className="za-still-law">QUALITY PICKS THE MODEL. COST ONLY BREAKS A TIE.</p>
        <div className="za-still-cells">
          <div>
            <div className="za-display text-cyan">10</div>
            <div className="za-mono">PUBLIC LANES</div>
          </div>
          <div>
            <div className="za-display text-cyan">18/19</div>
            <div className="za-mono">FLEET · 31 AUG</div>
          </div>
          <div>
            <div className="za-display text-cyan">1</div>
            <div className="za-mono">HUMAN ACCOUNTABLE</div>
          </div>
        </div>
        <p className="za-mono za-still-meta">
          PVE {PVE} · 2 HOSTS QUORATE · VALID THRU {EXPIRES_SHORT} · VERIFIED {VERIFIED_LONG}
        </p>
      </article>
      <button type="button" className="za-btn za-still-exit" onClick={onClose} autoFocus>
        EXIT STILL
      </button>
    </div>
  );
}
