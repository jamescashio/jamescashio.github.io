export type WorldArchitecture = "sovereign" | "hybrid" | "cloud";
export type WorldSensitivity = "mixed" | "public" | "private";
export type WorldInput = {
  architecture: WorldArchitecture;
  sensitivity: WorldSensitivity;
  connected: boolean;
  allowPrivateEgress: boolean;
};

export const TOTAL_REQUESTS = 12;

/** A deliberately bounded routing illustration, not an AI performance benchmark. */
export function computeWorldOutcome(input: WorldInput) {
  const privateCount = input.sensitivity === "private" ? TOTAL_REQUESTS : input.sensitivity === "mixed" ? 6 : 0;
  const publicCount = TOTAL_REQUESTS - privateCount;
  let local = 0;
  let cloud = 0;
  let held = 0;
  let summary: string;
  let internetDependency: string;
  let dataHandling: string;

  if (input.architecture === "sovereign") {
    local = TOTAL_REQUESTS;
    summary = "All 12 requests stay on your hardware. You operate the compute and control the data boundary.";
    internetDependency = input.connected
      ? "Local processing does not need this cloud connection."
      : "Cloud connection lost. Local processing continues in this model.";
    dataHandling = "Public and sensitive requests remain inside your local boundary.";
  } else if (input.architecture === "hybrid") {
    local = input.connected ? privateCount : TOTAL_REQUESTS;
    cloud = input.connected ? publicCount : 0;
    summary = input.connected
      ? `${local} requests stay local; ${cloud} public requests use the cloud. Sensitive data stays on your hardware.`
      : "The cloud connection is down. All 12 requests fall back to your hardware in this model.";
    internetDependency = input.connected
      ? "Cloud routing needs a connection; this model also supports local fallback."
      : "Local fallback is active; it assumes sufficient local capability and capacity.";
    dataHandling = "Sensitive requests always stay local. Only public requests may use the cloud.";
  } else {
    if (input.connected) {
      cloud = input.allowPrivateEgress ? TOTAL_REQUESTS : publicCount;
      held = TOTAL_REQUESTS - cloud;
      summary = held
        ? `${cloud} public requests use the cloud. ${held} sensitive requests wait because permission to send them is off.`
        : "All 12 requests use an external cloud provider. Your data crosses the local boundary.";
    } else {
      held = TOTAL_REQUESTS;
      summary = "The cloud connection is down. All 12 requests wait; this cloud-only model has no local fallback.";
    }
    internetDependency = "An available cloud connection is required for every request.";
    dataHandling =
      input.allowPrivateEgress && privateCount > 0
        ? "You have permitted sensitive data to cross the local boundary in this illustration."
        : "Sensitive requests wait unless you explicitly permit them to leave your hardware.";
  }

  return { local, cloud, held, privateCount, publicCount, summary, internetDependency, dataHandling };
}
