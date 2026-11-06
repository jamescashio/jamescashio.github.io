// Fills the V44 front door's evidence placeholders from status.json at build and dev time,
// so the published page and the published record can never disagree.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { houseDate } from "../src/shared/dates.ts";

// Each withheld field in plain words; the reason beside it comes from the record itself.
const LABELS = {
  "lanes.public": "Which public AI services are used",
  "lanes.privateCatalog": "Which models run privately",
  routingVerified: "Whether routing works end to end",
  "cluster.version": "Server software versions",
  "cluster.quorate": "Whether the cluster has enough votes to coordinate",
  "containers.zeus": "What runs on each server",
  "containers.apollo": null,
  "scheduler.enabled": "Whether the job scheduler is on",
  "scheduler.definitions": "The list of scheduled jobs",
  "modelConfiguration.contextWindow": "Local model settings",
  "backup.restoredFiles": "A practice restore",
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
  // A cue is the text after its timing line; identifiers, NOTE, STYLE and REGION blocks and the header are not words.
  const lines = String(vtt)
    .replace(/\r/g, "")
    .split(/\n\n+/)
    .map((block) => block.split("\n"))
    .map((rows) => {
      const timing = rows.findIndex((row) => row.includes("-->"));
      return timing < 0 ? [] : rows.slice(timing + 1).filter(Boolean);
    })
    .filter((cue) => cue.length)
    .map((cue) => cue.join(" "));
  if (!lines.length) throw new Error("the trailer captions have no lines");
  return lines;
}

/**
 * Every figure the page or E.V.E. prints must be a whole, non negative count that agrees with the
 * figures around it. A malformed export stops the build instead of reaching a visitor.
 */
export function checkStatus(status) {
  const at = (key) => key.split(".").reduce((value, part) => value?.[part], status);
  const count = (key) => {
    const value = at(key);
    if (value === null || value === undefined) throw new Error(`status.json has no value for ${key}`);
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`status.json ${key} must be a whole count, not ${value}`);
    return value;
  };
  const atMost = (small, large) => {
    if (count(small) > count(large)) throw new Error(`status.json ${small} cannot exceed ${large}`);
  };
  for (const key of ["cluster.hostsOnline", "backup.snapshotsListed"]) count(key);
  atMost("containers.running", "containers.documented");
  atMost("virtualMachines.running", "virtualMachines.documented");
  atMost("backup.latestVerified", "backup.latestChecked");
  atMost("backup.latestChecked", "backup.snapshotsListed");
  longDate(status.verified);
  // Every withheld field carries its reason, so the page never prints a limit without saying why.
  const reasons = status.withheldReasons;
  if (!reasons || typeof reasons !== "object" || Array.isArray(reasons) || !Object.keys(reasons).length)
    throw new Error("status.json withheldReasons must list each withheld field with its reason");
  for (const [key, reason] of Object.entries(reasons))
    if (typeof reason !== "string" || !reason.trim())
      throw new Error(`status.json withheldReasons.${key} has no reason`);
  return status;
}

export function statusTokens(root) {
  // The published export itself, so the page and /status.json are built from one file.
  const status = checkStatus(JSON.parse(readFileSync(path.join(root, "public/status.json"), "utf8")));
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

/**
 * The commit this build was made from, with "-dirty" when the tree had uncommitted changes, so an
 * audit can prove which code it measured. Builds outside a git checkout say "unknown".
 */
export function buildCommit(root) {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
      cwd: root,
      encoding: "utf8",
    });
    return dirty.trim() ? `${sha}-dirty` : sha;
  } catch {
    return "unknown";
  }
}

export function fillStatus(html, root) {
  let out = html;
  for (const [token, value] of statusTokens(root)) out = out.split(token).join(value);
  out = out.split("{{build.commit}}").join(escapeHtml(buildCommit(root)));
  const left = out.match(/\{\{(?:status|film|release|build)\.[^}]+\}\}/);
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
