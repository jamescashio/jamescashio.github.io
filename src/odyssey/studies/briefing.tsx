import { useEffect, useState } from "react";
import { BRIEF_FACTS } from "../fleet-evidence";
import { Arrow } from "../effects";
import { EvidencePillars } from "../secondary-study-visuals";
import { Toggle } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function BriefingLab({ input, onChange }: ExperimentProps<"briefing">) {
  const { chosen } = input;
  const [brief, setBrief] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    setBrief([]);
    setCopied(false);
    setCopyError(false);
  }, [input]);
  const text = BRIEF_FACTS.filter((fact) => brief.includes(fact.id));
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        text.map((fact) => `${fact.fact}\nSo what: ${fact.consequence}\nSource: ${fact.source}`).join("\n\n") +
          "\n\nNext decision: verify the service or routing claim needed for the decision before expanding automation.",
      );
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <>
      <EvidencePillars chosen={chosen} composed={text.length > 0} />
      <div className="o-brief-header">
        <span className="o-micro">01 / SELECT YOUR EVIDENCE</span>
        <span>{chosen.length} sources</span>
      </div>
      {BRIEF_FACTS.map((fact) => (
        <Toggle
          key={fact.id}
          label={fact.label}
          checked={chosen.includes(fact.id)}
          onChange={(checked) => {
            onChange({ ...input, chosen: checked ? [...chosen, fact.id] : chosen.filter((id) => id !== fact.id) });
            setBrief([]);
            setCopied(false);
            setCopyError(false);
          }}
        />
      ))}
      <button
        className="o-button o-button-gold o-run"
        disabled={!chosen.length}
        onClick={() => {
          setBrief([...chosen]);
          setCopied(false);
        }}
      >
        Compose the brief
        <Arrow />
      </button>
      <div className="o-brief-output" role="status">
        <span className="o-micro">02 / THE DECISION BRIEF</span>
        {text.length ? (
          <>
            <h4>Evidence before expansion.</h4>
            {text.map((fact) => (
              <div key={fact.id}>
                <p>{fact.fact}</p>
                <p className="o-muted">{fact.consequence}</p>
                <span className="o-micro">{fact.source}</span>
              </div>
            ))}
            <strong>Next decision</strong>
            <p>Verify the service or routing claim needed for the decision before expanding automation.</p>
          </>
        ) : (
          <p>
            Select the dated evidence to include. The brief separates the observation, its implication, and the next
            decision.
          </p>
        )}
      </div>
      {text.length > 0 && (
        <button className="o-text-button" onClick={copy}>
          {copied ? "Brief copied ✓" : "Copy your brief"}
          <Arrow diagonal />
        </button>
      )}
      {copyError && (
        <p className="o-lab-note" role="status">
          Clipboard unavailable. Select the brief above and copy it directly.
        </p>
      )}
      <p className="o-lab-note">
        Assembled locally from the dated export and operating philosophy. This is a structured example, not a generated
        AI response.
      </p>
    </>
  );
}
