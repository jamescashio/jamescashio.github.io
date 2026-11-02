import snapshot from "../../public/status.json";
import release from "../../public/v40/site-release.json";

export { snapshot };
export const presentation: typeof release.presentation;
export const observedDate: string;
export const observedShortDate: string;
export const observedMonth: string;
export const updatedDate: string;
export const fleetSummary: string;
export const fleetLine: string;
export const backupSummary: string;
