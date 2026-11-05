// Fills the V44 front door's evidence placeholders from status.json at build and dev time,
// so the published page and the published record can never disagree.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { houseDate } from "../src/shared/dates.ts";

const LABELS = {
  "lanes.public": "Public capability lanes",
  "lanes.privateCatalog": "Private model catalog",
  routingVerified: "End to end routing",
  "cluster.version": "Hypervisor version",
  "cluster.quorate": "Cluster quorum",
  "containers.zeus": "Guests per host",
  "containers.apollo": null,
  "scheduler.enabled": "Scheduler",
  "scheduler.definitions": "Scheduled job inventory",
  "modelConfiguration.contextWindow": "Local model configuration",
  "backup.restoredFiles": "Restore rehearsal",
  "backup.fullSystemRecovery": "Full recovery",
};

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** An ISO calendar date in the house style: "Wed Nov 4, 2026". Anything but a real YYYY-MM-DD date throws. */
export const longDate = houseDate;

/** The withheld items the page prints, in order, with their labels. E.V.E. counts this same list. */
export function withheldList(status) {
  return Object.entries(status.withheldReasons || {})
    .filter(([key]) => LABELS[key] !== null)
    .map(([key, reason]) => ({ label: LABELS[key] || key, reason }));
}

/** The trailer's spoken words, read from its caption file so the transcript and the captions cannot drift. */
export function transcript(vtt) {
  const lines = String(vtt)
    .replace(/\r/g, "")
    .split(/\n\n+/)
    .map((block) => block.split("\n").filter((line) => line && !/^WEBVTT/.test(line) && !/-->/.test(line)))
    .filter((cue) => cue.length)
    .map((cue) => cue.join(" "));
  if (!lines.length) throw new Error("the trailer captions have no lines");
  return lines;
}

export function statusTokens(root) {
  // The published export itself, so the page and /status.json are built from one file.
  const status = JSON.parse(readFileSync(path.join(root, "public/status.json"), "utf8"));
  const tokens = new Map();
  const put = (key, value) => {
    if (value === null || value === undefined) throw new Error(`status.json has no value for ${key}`);
    tokens.set(`{{status.${key}}}`, escapeHtml(value));
  };
  put("verified", status.verified);
  put("verifiedDay", longDate(status.verified));
  put("containers.running", status.containers.running);
  put("containers.documented", status.containers.documented);
  put("virtualMachines.running", status.virtualMachines.running);
  put("virtualMachines.documented", status.virtualMachines.documented);
  put("cluster.hostsOnline", status.cluster.hostsOnline);
  put("backup.latestVerified", status.backup.latestVerified);
  put("backup.latestChecked", status.backup.latestChecked);
  // The release date and name come from the receipt, so the footer and E.V.E. never drift from it.
  const receipt = JSON.parse(readFileSync(path.join(root, "public/v40/site-release.json"), "utf8"));
  const release = {
    version: `V${String(receipt.experienceVersion).split(".")[0]}`,
    name: receipt.presentation?.name,
    updated: houseDate(receipt.updatedDate),
  };
  if (!release.name) throw new Error("the release receipt has no presentation name");
  tokens.set("{{release.updated}}", escapeHtml(release.updated));
  const record = {
    release,
    verifiedDay: longDate(status.verified),
    law: status.law,
    containers: { running: status.containers.running, documented: status.containers.documented },
    virtualMachines: { running: status.virtualMachines.running, documented: status.virtualMachines.documented },
    cluster: { hostsOnline: status.cluster.hostsOnline },
    backup: {
      snapshotsListed: status.backup.snapshotsListed,
      latestChecked: status.backup.latestChecked,
      latestVerified: status.backup.latestVerified,
    },
    withheld: withheldList(status),
  };
  tokens.set("{{status.record}}", escapeHtml(JSON.stringify(record)));
  const withheld = record.withheld.map(
    ({ label, reason }) => `                  <li><strong>${escapeHtml(label)}</strong> ${escapeHtml(reason)}</li>`,
  );
  tokens.set("{{status.withheld}}", withheld.join("\n"));
  tokens.set("{{status.withheldCount}}", String(withheld.length));
  const records = readdirSync(path.join(root, "public/evidence"))
    .map((name) => name.match(/^status-(\d{4}-\d{2}-\d{2})\.json$/))
    .filter(Boolean)
    .map((m) => m[1])
    .sort()
    .reverse()
    .map((iso) => `                  <li><a href="/evidence/status-${iso}.json">${escapeHtml(longDate(iso))}</a></li>`);
  tokens.set("{{status.history}}", records.join("\n"));
  const words = transcript(readFileSync(path.join(root, "public/assets/hero/cashio-trailer-text.vtt"), "utf8"));
  tokens.set("{{film.trailerWords}}", words.map((line) => `                  <li>${escapeHtml(line)}</li>`).join("\n"));
  return tokens;
}

export function fillStatus(html, root) {
  let out = html;
  for (const [token, value] of statusTokens(root)) out = out.split(token).join(value);
  const left = out.match(/\{\{(?:status|film|release)\.[^}]+\}\}/);
  if (left) throw new Error(`Unfilled evidence placeholder ${left[0]}`);
  return out;
}

export function v44Status(root) {
  return {
    name: "v44-status",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!/\{\{(?:status|film|release)\./.test(html)) return html;
        if (ctx.filename && path.resolve(ctx.filename) !== path.join(root, "index.html")) return html;
        return fillStatus(html, root);
      },
    },
  };
}
