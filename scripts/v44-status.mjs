// Fills the V44 front door's evidence placeholders from status.json at build and dev time,
// so the published page and the published record can never disagree.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** An ISO calendar date in the house style: "Wed Nov 4, 2026". */
export function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(day.getTime()) || day.getUTCDate() !== d) throw new Error(`not a calendar date: ${iso}`);
  return `${DAYS[day.getUTCDay()]} ${MONTHS[m - 1]} ${d}, ${y}`;
}

export function statusTokens(root) {
  const status = JSON.parse(readFileSync(path.join(root, "status.json"), "utf8"));
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
  const record = {
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
    withheldReasons: status.withheldReasons || {},
  };
  tokens.set("{{status.record}}", escapeHtml(JSON.stringify(record)));
  const withheld = Object.entries(status.withheldReasons || {})
    .filter(([key]) => LABELS[key] !== null)
    .map(
      ([key, reason]) =>
        `                  <li><strong>${escapeHtml(LABELS[key] || key)}</strong> ${escapeHtml(reason)}</li>`,
    );
  tokens.set("{{status.withheld}}", withheld.join("\n"));
  const records = readdirSync(path.join(root, "public/evidence"))
    .map((name) => name.match(/^status-(\d{4}-\d{2}-\d{2})\.json$/))
    .filter(Boolean)
    .map((m) => m[1])
    .sort()
    .reverse()
    .map((iso) => `                  <li><a href="/evidence/status-${iso}.json">${escapeHtml(longDate(iso))}</a></li>`);
  tokens.set("{{status.history}}", records.join("\n"));
  return tokens;
}

export function fillStatus(html, root) {
  let out = html;
  for (const [token, value] of statusTokens(root)) out = out.split(token).join(value);
  const left = out.match(/\{\{status\.[^}]+\}\}/);
  if (left) throw new Error(`Unfilled evidence placeholder ${left[0]}`);
  return out;
}

export function v44Status(root) {
  return {
    name: "v44-status",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!html.includes("{{status.")) return html;
        if (ctx.filename && path.resolve(ctx.filename) !== path.join(root, "index.html")) return html;
        return fillStatus(html, root);
      },
    },
  };
}
