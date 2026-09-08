import archive from "../../public/evidence/status-2026-08-28.json";
import { evidenceCount, FLEET_EVIDENCE as observation } from "./fleet-evidence";

/** A case from the recorded audit, separate from the illustrative routing studies. */
export function AuditStory() {
  return (
    <details className="o-audit-story">
      <summary>How the audit changed this record</summary>
      <div className="o-audit-story-body">
        <span className="o-audit-kicker">HERMES / READ-ONLY AUDIT</span>
        <h3>One audit. Three decisions.</h3>
        <p>
          The question was simple: what is running, and what can this page prove? The owner-run HERMES audit checked the
          cluster inventory against direct guest lists.
        </p>
        <table>
          <caption>
            Fleet observations: <time dateTime={archive.verified}>{archive.verifiedLong}</time> and{" "}
            <time dateTime={observation.verified}>{observation.verifiedLong}</time>. The archived routing inventory has
            its own date: <time dateTime={archive.routingVerified}>21 August 2026</time>.
          </caption>
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col">Archive</th>
              <th scope="col">Latest</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">LXC running</th>
              <td>{archive.containers.running}</td>
              <td>{observation.containers.running}</td>
            </tr>
            <tr>
              <th scope="row">QEMU running</th>
              <td>Not recorded</td>
              <td>{observation.virtualMachines.running}</td>
            </tr>
            <tr>
              <th scope="row">Public lanes</th>
              <td>{archive.lanes.public}</td>
              <td>{evidenceCount(observation.lanes.public)}</td>
            </tr>
          </tbody>
        </table>
        <ol>
          <li>
            <strong>Count the same thing.</strong>
            <p>
              Keep LXC containers and QEMU virtual machines separate. “Not recorded” in the older export does not mean
              no VM existed.
            </p>
          </li>
          <li>
            <strong>Let unknown stay unknown.</strong>
            <p>
              The earlier lane count stays in its archive. Without a current inventory and execution record, this
              observation leaves it unverified.
            </p>
          </li>
          <li>
            <strong>Keep the claim inside the evidence.</strong>
            <p>
              A running guest does not prove application health, successful recovery, or failover readiness. Those need
              their own checks.
            </p>
          </li>
        </ol>
        <p className="o-audit-outcome">
          <strong>The result:</strong> explicit counts, visible unknowns, and an older record you can still inspect.
          This is a dated infrastructure audit, not a demonstration of live AI routing.
        </p>
      </div>
    </details>
  );
}
