import type { MouseEvent } from "react";
import { Arrow } from "./effects";
import { FLEET_EVIDENCE } from "./fleet-evidence";
import { shareExperiment } from "./study-experiment";

// Pin the evidence to a published release. A later website revision must not
// silently change what this case study cites or imply a newer fleet probe.
const SOURCE = "https://github.com/jamescashio/jamescashio.github.io/blob/4de877e57e1035866f79c2f47c6a0299ae4a6e70/";
const STUDY = "https://github.com/jamescashio/jamescashio.github.io/blob/8248189c073928a45f1da05dd6d06e62a21df2f8/";

function loadExample(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const oldURL = location.href;
  const newURL = event.currentTarget.href;
  if (newURL !== oldURL) history.pushState(null, "", newURL);
  // Reapply an unchanged link too, so a visitor can reset controls they edited.
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL }));
  requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("#project-panel .o-run")?.focus());
}

export function BuildStory() {
  return (
    <article className="o-build-story" aria-labelledby="build-story-title">
      <header>
        <span className="o-kicker">INSIDE THE HERMES STUDY</span>
        <h3 id="build-story-title">A private request meets a human.</h3>
        <p>Route the same request twice. Change only the privacy boundary.</p>
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
            <dt>Problem</dt>
            <dd>A useful route is only part of the decision. Who decides whether private information may leave?</dd>
          </div>
          <div>
            <dt>Decision</dt>
            <dd>
              In this browser study, private data holds the external route for human review. Requests needing sources
              follow a research lane; ordinary public work can take a simpler path.
            </dd>
          </div>
          <div>
            <dt>Outcome</dt>
            <dd>
              Load the public example, then choose Route this request: requiring sources selects Research, even for an
              Analyze task. Load the private version and run it again: Human review takes priority and the external
              route is held. The links only set the controls. No AI request is sent.
            </dd>
          </div>
        </dl>
      </div>
      <details className="o-field-notes">
        <summary>
          Inspect the model and the dated record<span aria-hidden="true">+</span>
        </summary>
        <p>
          The model and its checks below are pinned to V37.11. They prove the public study’s behavior, not the current
          HERMES deployment. The latest fleet observation is dated {FLEET_EVIDENCE.verifiedLong}; that audit did not
          establish a current routing inventory or execution record.
        </p>
        <dl>
          <div>
            <dt>Model</dt>
            <dd>
              <a className="o-text-button" href={`${STUDY}src/odyssey/data.ts`} target="_blank" rel="noreferrer">
                Inspect the routing decisions <Arrow diagonal />
              </a>{" "}
              <a
                className="o-text-button"
                href={`${STUDY}tests/odyssey-models.test.mjs`}
                target="_blank"
                rel="noreferrer"
              >
                Read the privacy-boundary checks <Arrow diagonal />
              </a>
            </dd>
          </div>
          <div>
            <dt>Artifact</dt>
            <dd>
              <a className="o-text-button" href="/status.json" target="_blank" rel="noreferrer">
                The latest dated observation <Arrow diagonal />
              </a>{" "}
              <a className="o-text-button" href={`${SOURCE}public/status.json`} target="_blank" rel="noreferrer">
                The 28 August 2026 archive <Arrow diagonal />
              </a>
            </dd>
          </div>
          <div>
            <dt>Checks</dt>
            <dd>
              <a
                className="o-text-button"
                href={`${SOURCE}scripts/public_repo_guard.py`}
                target="_blank"
                rel="noreferrer"
              >
                The public-data scan <Arrow diagonal />
              </a>{" "}
              <a
                className="o-text-button"
                href={`${SOURCE}.github/workflows/pages.yml`}
                target="_blank"
                rel="noreferrer"
              >
                The release workflow <Arrow diagonal />
              </a>
            </dd>
          </div>
          <div>
            <dt>Continuity</dt>
            <dd>
              <a className="o-text-button" href={`${SOURCE}public/legacy-route.js`} target="_blank" rel="noreferrer">
                How saved links are preserved <Arrow diagonal />
              </a>
            </dd>
          </div>
        </dl>
        <p>
          The website keeps releases and evidence on separate clocks. V37.9 preserved the 28 August 2026 fleet and 21
          August 2026 routing records through its redesign. Those records and the original command-deck links remain
          available as history. A fresh interface does not establish a fresh fleet probe.{" "}
          <a
            className="o-text-button"
            href="https://github.com/jamescashio/jamescashio.github.io/pull/115"
            target="_blank"
            rel="noreferrer"
          >
            Read the V37.9 release change <Arrow diagonal />
          </a>
        </p>
      </details>
    </article>
  );
}
