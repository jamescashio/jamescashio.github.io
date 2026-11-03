import variants from "./style-variants.json";
// Every finite interaction variant has an external rule; no runtime style injection.
export function classFor(declarations: string) {
  const name = (variants as Record<string, string>)[declarations];
  if (!name) throw new Error("Unmapped V41 style variant");
  return name;
}
