import { Arrow } from "./effects";

// Pin the evidence to a published release. A later website revision must not
// silently change what this case study cites or imply a newer fleet probe.
const SOURCE = "https://github.com/jamescashio/jamescashio.github.io/blob/4de877e57e1035866f79c2f47c6a0299ae4a6e70/";

export function BuildStory() {
  return (
    <article className="o-build-story" aria-labelledby="build-story-title">
      <header>
        <span className="o-kicker">A REAL BUILD / CASHIO.US</span>
        <h3 id="build-story-title">Evidence that survives a redesign.</h3>
        <p>A new interface is not a new measurement.</p>
      </header>
      <div className="o-field-notes">
        <dl>
          <div>
            <dt>Problem</dt>
            <dd>A fresh design could make an older fleet snapshot look current—or strand a visitor’s saved links.</dd>
          </div>
          <div>
            <dt>Decision</dt>
            <dd>
              Keep the release and the evidence on separate clocks. Publish dated aggregates, scan public files for
              common secrets and private addresses, and preserve the original routes.
            </dd>
          </div>
          <div>
            <dt>Outcome</dt>
            <dd>
              V37.9 retained the 28 August 2026 fleet observation and the separate 21 August routing date. Saved
              command-deck links still lead to the original experience.
            </dd>
          </div>
        </dl>
      </div>
      <details className="o-field-notes">
        <summary>
          Inspect the published record<span aria-hidden="true">+</span>
        </summary>
        <p>
          The tradeoff is deliberate: an inspectable historical record instead of a live fleet readout. The source below
          is pinned to the released V37.9 code; it does not establish what is running today.
        </p>
        <dl>
          <div>
            <dt>Artifact</dt>
            <dd>
              <a className="o-text-button" href={`${SOURCE}public/status.json`} target="_blank" rel="noreferrer">
                The dated public snapshot <Arrow diagonal />
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
