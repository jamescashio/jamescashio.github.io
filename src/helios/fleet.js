// Published observations stay dated; pageRevised is the interface date.
export const FLEET = {
  observedLong: "October 3, 2026",
  observedShort: "Oct 3",
  method: "cluster API, read only",
  hosts: 2,
  lxc: 20,
  qemu: 1,
  quorate: true,
  routing: "Not verified",
  pageRevised: "October 3, 2026",
  auditLong: "September 18, 2026",
  consoleBriefLong: "September 8, 2026",
  // Backup coverage counts and per host guest counts stay out of the public record.
  backups: {
    integrity: "every snapshot on record passed verification",
    checkedLong: "October 3, 2026",
    restoreTested: null,
  },
  // Exact software versions, kernels and the model tag stay out of the public record.
  atlas: { context: 16384, observedLong: "October 3, 2026" },
  hermes: { jobs: 49, records: 56, observedLong: "October 3, 2026", budgetPeriod: "October 2026" },
  prior: {
    release: "V37.11",
    fleetLong: "September 7, 2026",
    fleetShort: "Sep 7",
    lxc: 19,
    qemu: 1,
    lanes: "Not verified",
    method: "HERMES audit",
  },
  archive: {
    release: "V35",
    fleetLong: "August 28, 2026",
    fleetShort: "Aug 28",
    routingLong: "August 21, 2026",
    lxc: 18,
    qemu: "Not recorded",
    lanes: 10,
    expiry: "September 27, 2026",
  },
  // Spend is withheld until a fresh measurement exists; the V31 sample stays in its archived export.
  cost: { status: "withheld", archivedSample: "July 21 to 22, 2026", archivedRelease: "V31" },
};
