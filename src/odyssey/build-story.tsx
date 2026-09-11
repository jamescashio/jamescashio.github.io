import { loadStudyExample as loadExample } from "./study-navigation";
import { Arrow } from "./effects";
import operatingRecord from "../../public/evidence/status-2026-09-07.json";
import { shareExperiment } from "./study-experiment";
import { COST_EVIDENCE } from "../lib/cost-evidence";

// Pin the public model and observation. A website edit does not refresh either.
const STUDY = "https://github.com/jamescashio/jamescashio.github.io/blob/0c509286ed9329b897741e1afe505376deb443ce/";

export function BuildStory() {
  return (
    <article className="o-build-story" aria-labelledby="operating-story-title">
      <section className="o-build-proof" id="smart-routing" aria-labelledby="operating-story-title">
        <header>
          <span className="o-kicker">FROM MY WORKSHOP / SMART ROUTING</span>
          <h3 id="operating-story-title">Spend the AI budget where it matters.</h3>
          <p>I reserve the more capable route for work that needs it.</p>
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
              <dd>One expensive default treats routine work and hard decisions alike.</dd>
            </div>
            <div>
              <dt>My decision</dt>
              <dd>
                Atlas handles recurring work; harder tasks can escalate. I check quality, privacy and reliability before
                considering cost.
              </dd>
            </div>
            <div>
              <dt>The recorded result</dt>
              <dd>A two-day record of provider usage. The sample scope and exclusions are available below.</dd>
            </div>
          </dl>
        </div>
        <nav className="o-story-actions" aria-label="Try the smart-routing idea">
          <a
            className="o-button o-button-gold o-story-demo"
            href={shareExperiment({ study: "hermes", intent: "draft", sources: false, privateData: false })}
            onClick={loadExample}
          >
            Try the routing demo <Arrow />
          </a>
          <a className="o-text-button" href="#study-browser">
            Explore the seven studies <Arrow />
          </a>
        </nav>
        <section className="o-field-notes o-interface-notes" aria-label="Inspect the shipped interface">
          <figure className="o-workshop-capture">
            <a
              href="/evidence/workshop/hermes-public-interface.webp"
              target="_blank"
              rel="noreferrer"
              aria-label="View the full HERMES interface capture"
            >
              <img
                src="/evidence/workshop/hermes-public-interface.webp"
                width="881"
                height="904"
                loading="lazy"
                decoding="async"
                alt="Actual public HERMES interface: Draft selected, private information and source requirements off; the completed result is Workhorse."
              />
            </a>
            <div className="o-workshop-annotations">
              <span className="o-kicker">THE SHIPPED INTERFACE</span>
              <h4>A decision you can inspect.</h4>
              <ol>
                <li>
                  <strong>Routine work has a general lane.</strong>
                  <p>A public draft reaches Workhorse. Each of the five steps explains why.</p>
                </li>
                <li>
                  <strong>The boundary gets the final say.</strong>
                  <p>Sources select Research. Private information calls for a person.</p>
                </li>
              </ol>
              <a
                className="o-text-button"
                href={shareExperiment({ study: "hermes", intent: "draft", sources: false, privateData: false })}
                onClick={loadExample}
              >
                Try these exact inputs <Arrow />
              </a>
            </div>
            <figcaption>
              Actual V37.13 interface · public demonstration, not live Atlas routing.
              <a href="/evidence/workshop/provenance.json">
                Capture source and settings <Arrow diagonal />
              </a>
            </figcaption>
          </figure>
        </section>
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
      </section>
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
