import { useState } from "react";
import { LINEAGE, LINEAGE_EVIDENCE } from "../lib/content";
import { Arrow } from "./effects";

export function Lineage() {
  const [selected, setSelected] = useState(1);
  const item = LINEAGE[selected];
  const evidence = LINEAGE_EVIDENCE[selected];
  return (
    <section className="o-lineage o-scene" id="lineage" aria-labelledby="lineage-title">
      <div className="o-section-top">
        <span className="o-kicker">04 / FLIGHT HERITAGE</span>
        <span className="o-micro">THE DISCIPLINE BEHIND THE DESIGN</span>
      </div>
      <div className="o-lineage-layout">
        <div className="o-lineage-copy">
          <h2 id="lineage-title">
            Built with a<br />
            <em>test pilot’s mind.</em>
          </h2>
          <p className="o-section-intro">The future rewards imagination. Flight teaches you to prove it.</p>
          <div className="o-pilots" aria-label="Flight inspirations">
            {LINEAGE.map((pilot, i) => (
              <button key={pilot.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                {pilot.name === "K. JOHNSON" ? "Johnson" : pilot.name.charAt(0) + pilot.name.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="o-flight-principle" aria-live="polite">
            <span className="o-micro">{item.craft}</span>
            <h3>{item.rule}</h3>
            <p>{item.note}</p>
            <span className="o-lab-note">
              A working principle inspired by this lineage, not a historical quotation.
            </span>
          </div>
        </div>
        <figure className="o-aircraft">
          <div>
            <img key={evidence.src} src={evidence.src} alt={evidence.alt} loading="lazy" width="1280" height="800" />
            <span className="o-aircraft-mark" aria-hidden="true">
              +<br />+
            </span>
          </div>
          <figcaption>
            <span>{evidence.credit}</span>
            <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
              Photo source
              <Arrow diagonal />
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
