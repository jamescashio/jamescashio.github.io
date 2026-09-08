import { GRAPH_NODES, PROJECTS, type RouteInput } from "./data";

export type StudyId = (typeof PROJECTS)[number]["id"];
export type Experiment =
  | ({ study: "hermes" } & RouteInput)
  | { study: "cascade"; severity: number; confidence: number }
  | { study: "exposure"; reachable: boolean; auth: boolean; critical: boolean }
  | { study: "briefing"; chosen: string[] }
  | { study: "dashboards"; age: number }
  | { study: "signal"; deviation: number; corroborated: boolean }
  | { study: "graphify"; selected: string };

export type StudyExperiment<T extends StudyId> = Extract<Experiment, { study: T }>;
export type ExperimentProps<T extends StudyId> = {
  input: StudyExperiment<T>;
  onChange: (next: StudyExperiment<T>) => void;
};

const DEFAULTS: Record<StudyId, Experiment> = {
  hermes: { study: "hermes", intent: "draft", privateData: false, sources: false },
  cascade: { study: "cascade", severity: 25, confidence: 90 },
  exposure: { study: "exposure", reachable: true, auth: false, critical: true },
  briefing: { study: "briefing", chosen: ["fleet", "authority"] },
  dashboards: { study: "dashboards", age: 0 },
  signal: { study: "signal", deviation: 15, corroborated: false },
  graphify: { study: "graphify", selected: "policy" },
};

export function defaultExperiment(study: StudyId): Experiment {
  const value = DEFAULTS[study];
  return value.study === "briefing" ? { ...value, chosen: [...value.chosen] } : { ...value };
}

/** Only these synthetic controls enter a share link. Unknown fields never execute. */
export function parseExperiment(hash: string): Experiment | null {
  if (!hash.startsWith("#build=") || hash.length > 512) return null;
  const values = new URLSearchParams(hash.slice(1));
  const study = values.get("build") as StudyId;
  if (!PROJECTS.some((project) => project.id === study)) return null;
  const defaults = defaultExperiment(study);
  const number = (name: string, fallback: number, max = 100) => {
    const value = values.get(name);
    if (value === null || !/^\d{1,3}$/.test(value)) return fallback;
    return Math.min(max, Number(value));
  };
  const boolean = (name: string, fallback: boolean) => {
    const value = values.get(name);
    return value === "1" ? true : value === "0" ? false : fallback;
  };
  switch (defaults.study) {
    case "hermes": {
      const intent = values.get("intent");
      return {
        ...defaults,
        intent: intent === "research" || intent === "analyze" ? intent : "draft",
        privateData: boolean("private", defaults.privateData),
        sources: boolean("sources", defaults.sources),
      };
    }
    case "cascade":
      return {
        ...defaults,
        severity: number("severity", defaults.severity),
        confidence: number("confidence", defaults.confidence),
      };
    case "exposure":
      return {
        ...defaults,
        reachable: boolean("reachable", defaults.reachable),
        auth: boolean("auth", defaults.auth),
        critical: boolean("critical", defaults.critical),
      };
    case "briefing":
      return {
        ...defaults,
        chosen: values.has("facts")
          ? ["fleet", "routing", "authority"].filter((id) => values.get("facts")!.split(",").includes(id))
          : defaults.chosen,
      };
    case "dashboards":
      return { ...defaults, age: number("age", defaults.age, 48) };
    case "signal":
      return {
        ...defaults,
        deviation: number("deviation", defaults.deviation),
        corroborated: boolean("corroborated", defaults.corroborated),
      };
    case "graphify":
      return {
        ...defaults,
        selected: GRAPH_NODES.some((node) => node.id === values.get("module"))
          ? values.get("module")!
          : defaults.selected,
      };
  }
}

export function shareExperiment(input: Experiment): string {
  const values = new URLSearchParams({ build: input.study });
  const add = (name: string, value: number | boolean | string) =>
    values.set(name, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  switch (input.study) {
    case "hermes":
      add("intent", input.intent);
      add("private", input.privateData);
      add("sources", input.sources);
      break;
    case "cascade":
      add("severity", input.severity);
      add("confidence", input.confidence);
      break;
    case "exposure":
      add("reachable", input.reachable);
      add("auth", input.auth);
      add("critical", input.critical);
      break;
    case "briefing":
      add("facts", ["fleet", "routing", "authority"].filter((id) => input.chosen.includes(id)).join(","));
      break;
    case "dashboards":
      add("age", input.age);
      break;
    case "signal":
      add("deviation", input.deviation);
      add("corroborated", input.corroborated);
      break;
    case "graphify":
      add("module", input.selected);
      break;
  }
  return `#${values}`;
}
