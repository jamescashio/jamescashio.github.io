import snapshot from "../../public/status.json";
import release from "../../public/v43/site-release.json";
export { snapshot };
export const versionLabel = `V${release.experienceVersion.split(".")[0]}`;
export const presentation = { ...release.presentation, versionLabel };
export const observedDate = snapshot.verifiedLong;
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(new Date(date + "T12:00:00Z"));
export const observedShortDate = formatDate(snapshot.verified, { month: "short", day: "numeric" }).toUpperCase();
export const observedMonth = formatDate(snapshot.verified, { month: "long", year: "numeric" });
export const updatedDate = formatDate(release.updatedDate, { month: "long", day: "numeric", year: "numeric" });
export const fleetSummary = `${snapshot.containers.running} containers and ${snapshot.virtualMachines.running} virtual machine${snapshot.virtualMachines.running === 1 ? "" : "s"} on ${snapshot.cluster.hostsOnline} hosts`;
export const fleetLine = `${snapshot.cluster.hostsOnline} hosts · ${snapshot.containers.running} containers · ${snapshot.virtualMachines.running} VM${snapshot.virtualMachines.running === 1 ? "" : "s"}`;
export const backupResult = `${snapshot.backup.latestVerified} of ${snapshot.backup.latestChecked} latest reported snapshots passed their integrity check.`;
export const backupSummary = `${backupResult} Observed ${observedDate}.`;
