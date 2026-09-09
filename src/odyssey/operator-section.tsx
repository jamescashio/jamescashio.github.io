import type { MouseEvent } from "react";
import { Arrow } from "./effects";
import { loadStudyExample } from "./study-navigation";
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
      <section className="operator-process" id="operator-process" aria-labelledby="operator-process-title">
        <header>
          <span className="o-kicker">FROM MY BENCH TO YOUR BROWSER</span>
          <h3 id="operator-process-title">A small change. A better handoff.</h3>
          <p>A real improvement I shipped: sharing the decision, not just the page.</p>
        </header>
        <figure>
          <a
            href="/evidence/workshop/hermes-public-interface.webp"
            target="_blank"
            rel="noreferrer"
            aria-label="Inspect the actual HERMES interface capture"
          >
            <img
              src="/evidence/workshop/hermes-public-interface.webp"
              width="881"
              height="904"
              loading="lazy"
              decoding="async"
              alt="The shipped public HERMES interface showing a completed Workhorse routing decision."
            />
          </a>
          <figcaption>
            Actual V37.13 public interface. Browser demonstration; no live system access.
            <a href="/evidence/workshop/provenance.json">
              Capture details <Arrow diagonal />
            </a>
          </figcaption>
        </figure>
        <div>
          <ol>
            <li>
              <strong>Notice the friction.</strong>
              <p>A shared link opened the study, but the visitor had to reconstruct its settings.</p>
            </li>
            <li>
              <strong>Preserve the decision.</strong>
              <p>I added settings links to all seven studies. The next person can start with the same inputs.</p>
            </li>
            <li>
              <strong>Make it reproducible.</strong>
              <p>The link restores the controls. Running the experiment remains the visitor’s choice.</p>
            </li>
          </ol>
          <p className="operator-process-date">Shipped in V37.11 · 8 September 2026</p>
          <nav aria-label="Follow the build process">
            <a href="#build=hermes&intent=analyze&private=1&sources=1" onClick={loadStudyExample}>
              Try the shared experiment <Arrow />
            </a>
            <a href="https://github.com/jamescashio/jamescashio.github.io/pull/118" target="_blank" rel="noreferrer">
              Inspect the published change <Arrow diagonal />
            </a>
          </nav>
        </div>
      </section>
    </section>
  );
}
