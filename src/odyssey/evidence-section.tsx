import { Arrow } from "./effects";
import { FLEET_EVIDENCE } from "./fleet-evidence";
import { AuditStory } from "./audit-story";
import { EvidenceConsole } from "./evidence-console";
export function EvidenceSection({ onArt }: { onArt: () => void }) {
  return (
    <section className="o-evidence o-scene" id="evidence" aria-labelledby="evidence-title">
      <div className="o-evidence-copy">
        <span className="o-kicker">03 / THE EVIDENCE</span>
        <h2 id="evidence-title">
          Trust has
          <br />a <em>timestamp.</em>
        </h2>
        <p>A source. A date. A clear boundary.</p>
        <p className="o-muted">
          Ask E.V.E. what was observed and what remains unknown. Running guests do not establish application health,
          recovery or failover readiness.
        </p>
        <a href="/status.json" target="_blank" rel="noreferrer" className="o-text-button">
          Read the latest dated export
          <Arrow diagonal />
        </a>
        <div className="o-archive-dates">
          <div>
            <span>FLEET OBSERVATION</span>
            <strong>{FLEET_EVIDENCE.verifiedLong}</strong>
          </div>
          <div>
            <span>ROUTING INVENTORY</span>
            <strong>Not verified</strong>
          </div>
        </div>
        <a href={FLEET_EVIDENCE.archive.url} target="_blank" rel="noreferrer" className="o-text-button">
          Compare the August archive <Arrow diagonal />
        </a>
        <AuditStory />
      </div>
      <EvidenceConsole onArt={onArt} />
    </section>
  );
}
