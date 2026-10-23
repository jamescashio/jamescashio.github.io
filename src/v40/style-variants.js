import variants from "./style-variants.json";
// Every finite interaction variant has an external rule; no runtime style injection.
export function classFor(declarations) {
  const name = variants[declarations];
  if (!name) throw new Error("Unmapped V41 style variant");
  return name;
}
