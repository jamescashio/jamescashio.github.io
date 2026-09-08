import type { MouseEvent } from "react";
import { Arrow } from "./effects";
import operatingRecord from "../../public/evidence/status-2026-09-07.json";
import { shareExperiment } from "./study-experiment";
import { COST_EVIDENCE } from "../lib/cost-evidence";

// Pin the public model and observation. A website edit does not refresh either.
const STUDY = "https://github.com/jamescashio/jamescashio.github.io/blob/0c509286ed9329b897741e1afe505376deb443ce/";
const PREVIOUS = "https://github.com/jamescashio/jamescashio.github.io/blob/8248189c073928a45f1da05dd6d06e62a21df2f8/";

function loadExample(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const oldURL = location.href;
  const newURL = event.currentTarget.href;
  if (newURL !== oldURL) history.pushState(null, "", newURL);
  // Reapply an unchanged link too, so visitors can reset controls they edited.
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL }));
  requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("#project-panel .o-run")?.focus());
}

export function BuildStory() {
  return (
    <article className="o-build-story" aria-labelledby="build-story-title">
      <header>
        <span className="o-kicker">INSIDE THE HERMES STUDY</span>
        <h3 id="build-story-title">Same request. One changed boundary.</h3>
        <p>Compare a public request with its private version. The privacy decision changes the route.</p>
        <nav className="o-story-comparison" aria-label="Compare HERMES privacy decisions">
          {[false, true].map((privateData) => (
            <a
              key={String(privateData)}
              className="o-text-button"
              href={shareExperiment({ study: "hermes", intent: "analyze", sources: true, privateData })}
              onClick={loadExample}
            >
              {privateData ? "2. Load the private version" : "1. Load a public request"} <Arrow />
            </a>
          ))}
        </nav>
      </header>
      <div className="o-field-notes">
        <dl>
          <div>
            <dt>Try it</dt>
            <dd>Load the public example and choose Route this request. Requiring sources selects Research.</dd>
          </div>
          <div>
            <dt>Change it</dt>
            <dd>
              Load the private version and run it again. Human review now takes priority; the external route is held.
            </dd>
          </div>
          <div>
            <dt>Keep it</dt>
            <dd>Copy these settings to let someone else reproduce the decision. These examples send no AI requests.</dd>
          </div>
        </dl>
      </div>
      <section className="o-build-proof" id="smart-routing" aria-labelledby="operating-story-title">
        <header>
          <span className="o-kicker">FROM MY WORKSHOP / SMART ROUTING</span>
          <h3 id="operating-story-title">Spend the AI budget where it matters.</h3>
          <p>Routine jobs have a route. Complex work earns a more capable one.</p>
        </header>
        <div className="o-proof-result">
          <p>
            <strong>
              {Math.round(COST_EVIDENCE.usdPerDay * 100)}¢<small>/day</small>
            </strong>
            <span>Observed AI provider usage · historical sample</span>
          </p>
          <p className="o-proof-date">
            Sample · <time dateTime={COST_EVIDENCE.sampleStart}>21</time>–
            <time dateTime={COST_EVIDENCE.sampleEnd}>22 July 2026</time>
          </p>
        </div>
        <div className="o-field-notes">
          <dl>
            <div>
              <dt>The problem</dt>
              <dd>
                Recurring jobs and difficult decisions have different needs. Sending both through the same expensive
                route makes spending a default instead of a deliberate choice.
              </dd>
            </div>
            <div>
              <dt>My decision</dt>
              <dd>
                I route recurring work through Atlas and escalate when a task needs more capability. The policy puts
                quality, privacy, and reliability first; cost decides between routes that meet those requirements.
              </dd>
            </div>
            <div>
              <dt>The recorded result</dt>
              <dd>
                The {COST_EVIDENCE.sampleLabel} sample recorded ${COST_EVIDENCE.usdPerDay.toFixed(2)} per day in AI
                provider usage. V31 published that observation on 26 July. More capable routes remained available for
                work that justified them.
              </dd>
            </div>
          </dl>
        </div>
        <details className="o-field-notes o-cost-evidence">
          <summary>
            About the cost figure and the public demo<span aria-hidden="true">+</span>
          </summary>
          <p>
            The original V31 export records the figure and dates. Its scope covers{" "}
            {COST_EVIDENCE.includes.toLowerCase()}; it excludes {COST_EVIDENCE.excludes.toLowerCase()}. The source is a
            published operating observation, not an independently audited bill. It does not establish today’s spend or a
            percentage saving.
          </p>
          <p>
            Doug described the Atlas workflow on 8 September 2026. The browser study lets you explore routing priorities
            with synthetic inputs; it does not execute Atlas or measure spending. Current production routing remains
            unverified in the latest public observation.
          </p>
          <nav className="o-proof-sources" aria-label="Verify the historical cost sample">
            <a className="o-text-button" href={COST_EVIDENCE.source} target="_blank" rel="noreferrer">
              Read the V31 cost record <Arrow diagonal />
            </a>
            <a className="o-text-button" href={COST_EVIDENCE.scopeSource} target="_blank" rel="noreferrer">
              Read its scope and exclusions <Arrow diagonal />
            </a>
            <a className="o-text-button" href={COST_EVIDENCE.releaseSource} target="_blank" rel="noreferrer">
              Verify the July release <Arrow diagonal />
            </a>
          </nav>
        </details>
        <nav className="o-proof-sources" aria-label="Explore the smart-routing idea">
          <a
            className="o-text-button"
            href={shareExperiment({ study: "hermes", intent: "draft", sources: false, privateData: false })}
            onClick={loadExample}
          >
            Try a routine request <Arrow />
          </a>
          <a className="o-text-button" href={COST_EVIDENCE.source} target="_blank" rel="noreferrer">
            Inspect the original cost record <Arrow diagonal />
          </a>
        </nav>
      </section>
      <details className="o-field-notes o-build-records">
        <summary>
          One shipped improvement you can verify: a reproducible experiment<span aria-hidden="true">+</span>
        </summary>
        <p>
          Previously, a copied link opened a study without preserving its controls. I added settings links for all seven
          studies in V37.11, published on 8 September 2026. A recipient can now reopen the same inputs and inspect the
          same decision. Opening a HERMES link restores the controls; running it remains their choice.
        </p>
        <nav className="o-proof-sources" aria-label="Verify the reproducible experiment release">
          <a
            className="o-text-button"
            href={PREVIOUS + "src/odyssey/project-explorer.tsx"}
            target="_blank"
            rel="noreferrer"
          >
            Before: study-only links <Arrow diagonal />
          </a>
          <a
            className="o-text-button"
            href={STUDY + "src/odyssey/study-experiment.ts"}
            target="_blank"
            rel="noreferrer"
          >
            After: preserved settings <Arrow diagonal />
          </a>
          <a className="o-text-button" href={STUDY + "tests/odyssey-models.test.mjs"} target="_blank" rel="noreferrer">
            Read the model checks <Arrow diagonal />
          </a>
          <a
            className="o-text-button"
            href="https://github.com/jamescashio/jamescashio.github.io/pull/118"
            target="_blank"
            rel="noreferrer"
          >
            Read the published change <Arrow diagonal />
          </a>
        </nav>
      </details>
      <details className="o-field-notes o-build-records">
        <summary>
          Dated operating record: what the infrastructure observation establishes<span aria-hidden="true">+</span>
        </summary>
        <p>
          An owner-run, read-only HERMES audit compared the cluster inventory with direct guest lists. The observation
          records {operatingRecord.containers.running} running LXC containers and{" "}
          {operatingRecord.virtualMachines.running} running QEMU virtual machine across{" "}
          {operatingRecord.proxmox.hostsOnline} hosts on {operatingRecord.verifiedLong}. The reviewed public subset
          shipped in V37.11 on 8 September.
        </p>
        <p>
          These are guest inventory counts. They do not establish application health, recovery readiness, current AI
          routing, or the cost figure above. The August archive remains available; a later design does not refresh an
          older observation.
        </p>
        <nav className="o-proof-sources" aria-label="Verify the dated infrastructure record">
          <a className="o-text-button" href={STUDY + "public/status.json"} target="_blank" rel="noreferrer">
            Inspect the dated record <Arrow diagonal />
          </a>
          <a className="o-text-button" href={operatingRecord.archive.url} target="_blank" rel="noreferrer">
            Compare the August archive <Arrow diagonal />
          </a>
        </nav>
      </details>
    </article>
  );
}
