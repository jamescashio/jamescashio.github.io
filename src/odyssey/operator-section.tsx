import type { MouseEvent } from "react";
import { Arrow } from "./effects";
import { OperatorInsignia } from "./operator-insignia";
export function OperatorSection({
  motion,
  onExplore,
}: {
  motion: boolean;
  onExplore: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <section className="o-operator o-scene" id="operator" aria-labelledby="operator-title">
      <div className="o-section-top">
        <span className="o-kicker">05 / THE OPERATOR</span>
        <span className="o-micro">PENSACOLA, FLORIDA</span>
      </div>
      <div className="o-operator-layout">
        <OperatorInsignia motion={motion} onExplore={onExplore} />
        <div className="o-operator-copy">
          <span className="o-kicker">DOUG CASHIO</span>
          <h2 id="operator-title">
            Endlessly curious.
            <br />
            <em>Personally accountable.</em>
          </h2>
          <p className="o-operator-lead">
            Principal Solutions Consultant.
            <br />
            Independent systems builder.
          </p>
          <p>
            I make difficult system choices understandable: where AI runs, what it can use, and when a person takes
            over.
          </p>
          <p>
            This is my independent workshop: hardware I operate, tools I build, and evidence you can inspect. Science
            fiction supplies the imagination. Flight-test discipline keeps it honest.
          </p>
          <div className="o-operator-links">
            <a href="https://www.linkedin.com/in/dougcashio" target="_blank" rel="noreferrer">
              LinkedIn
              <Arrow diagonal />
            </a>
            <a href="https://github.com/jamescashio" target="_blank" rel="noreferrer">
              GitHub
              <Arrow diagonal />
            </a>
            <a href="https://www.credly.com/users/james-cashio/badges/credly" target="_blank" rel="noreferrer">
              Credentials
              <Arrow diagonal />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
