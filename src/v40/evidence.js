import snapshot from "../../public/status.json";
import release from "../../public/v40/site-release.json";
export { snapshot };
export const presentation = release.presentation;
export const observedDate = snapshot.verifiedLong;
const formatDate = (date, options) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(new Date(date + "T12:00:00Z"));
export const observedShortDate = formatDate(snapshot.verified, { month: "short", day: "numeric" }).toUpperCase();
export const updatedDate = formatDate(release.updatedDate, { month: "long", day: "numeric", year: "numeric" });
export const fleetSummary = `${snapshot.containers.running} containers and ${snapshot.virtualMachines.running} virtual machine on ${snapshot.cluster.hostsOnline} hosts`;
export const fleetLine = `${snapshot.cluster.hostsOnline} hosts · ${snapshot.containers.running} containers · ${snapshot.virtualMachines.running} VM`;
export const backupSummary = `${snapshot.backup.latestVerified} of ${snapshot.backup.latestChecked} latest reported snapshots passed their integrity check. Observed ${observedDate}.`;
