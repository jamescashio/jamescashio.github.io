import type { CSSProperties } from "react";

/** A brief visual transition after an explicit visitor action; never a loading gate. */
export function FoldTransition({ active, origin }: { active: boolean; origin?: { x: number; y: number } }) {
  if (!active) return null;
  return (
    <div
      className="eh-fold"
      aria-hidden="true"
      style={origin ? ({ "--eh-fold-x": `${origin.x}px`, "--eh-fold-y": `${origin.y}px` } as CSSProperties) : undefined}
    >
      <div className="eh-fold-grid" />
      <div className="eh-fold-aperture">
        {[0, 1, 2, 3, 4].map((index) => (
          <i key={index} style={{ animationDelay: `${index * 90}ms` }} />
        ))}
      </div>
      <div className="eh-fold-crosshair">
        <span />
        <span />
      </div>
      <div className="eh-fold-message">
        <span>V36 / THE HUMAN RECKONING</span>
        <strong>
          Human command.
          <br />
          <em>Unlimited possibility.</em>
        </strong>
        <div>
          <i />
          <span>CROSSING THE THRESHOLD</span>
        </div>
      </div>
      <div className="eh-fold-foot">
        <span>INTENT → QUALIFICATION → DISCOVERY</span>
        <span>ZEUSAPOLLO / COURSE ACCEPTED</span>
      </div>
    </div>
  );
}
