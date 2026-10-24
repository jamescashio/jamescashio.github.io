import snapshot from "../../public/status.json";
export { snapshot };
export const observedDate = snapshot.verifiedLong;
export const fleetSummary = `${snapshot.containers.running} containers and ${snapshot.virtualMachines.running} virtual machine on ${snapshot.cluster.hostsOnline} hosts`;
export const fleetLine = `${snapshot.cluster.hostsOnline} hosts · ${snapshot.containers.running} containers · ${snapshot.virtualMachines.running} VM`;
export const backupSummary = `${snapshot.backup.latestVerified} of ${snapshot.backup.latestChecked} latest reported snapshots passed their integrity check. Observed ${observedDate}.`;
