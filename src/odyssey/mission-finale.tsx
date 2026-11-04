import { useEffect, useState, type ReactNode, type RefObject } from "react";
import type { WorldInput } from "./sovereign-model";
import { missionRecord, normalizeCallsign } from "./mission-card";
import type { MissionFormat } from "./cinematic-mission-card";
import { StarshipPoster } from "./starship-poster";

type PreparedCard = { url: string; preview: string; file: File; shareable: boolean; callsign: string };

function imagePreview(blob: Blob): Promise<string> {
  // The live site's image policy permits inline PNGs, but excludes Blob image URLs.
  // Read the already encoded image without rendering or encoding the card again.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be read."));
    reader.onerror = () => reject(reader.error || new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}

export function MissionFinale({
  still,
  input,
  headingRef,
  copied,
  onCopy,
  onReplay,
  onClose,
  privateRequest,
  children,
}: {
  still: HTMLCanvasElement | null;
  input: WorldInput;
  headingRef: RefObject<HTMLHeadingElement | null>;
  copied: boolean;
  onCopy: () => void;
  onReplay: () => void;
  onClose: (destination?: string) => void;
  privateRequest: string;
  children: ReactNode;
}) {
  const [format, setFormat] = useState<MissionFormat>("portrait");
  const [cards, setCards] = useState<Partial<Record<MissionFormat, PreparedCard>>>({});
  const [status, setStatus] = useState("Preparing your flight record…");
  const [sharing, setSharing] = useState(false);
  const [preparationFailed, setPreparationFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [draftCallsign, setDraftCallsign] = useState("");
  const [callsign, setCallsign] = useState("");
  const record = missionRecord(input, `${location.origin}${location.pathname}`);
  const selected = cards[format]?.callsign === callsign ? cards[format] : undefined;

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    async function prepare() {
      try {
        if (!still) throw new Error("The scene image is unavailable.");
        const { createCinematicMissionCard } = await import("./cinematic-mission-card");
        await document.fonts.ready;
        const images = await Promise.all(
          (["portrait", "landscape"] as const).map(async (layout) => {
            const { blob, filename } = await createCinematicMissionCard(
              still,
              input,
              layout,
              `${location.origin}${location.pathname}`,
              callsign,
            );
            if (cancelled) return null;
            const preview = await imagePreview(blob);
            if (cancelled) return null;
            const url = URL.createObjectURL(blob);
            urls.push(url);
            const file = new File([blob], filename, { type: "image/png" });
            let shareable = false;
            try {
              shareable = !!navigator.canShare?.({ files: [file] });
            } catch {
              /* Save and copy remain available. */
            }
            return [layout, { url, preview, file, shareable, callsign }] as const;
          }),
        );
        if (cancelled) return;
        setCards(Object.fromEntries(images.filter((item) => item !== null)));
        setStatus("Your record is ready. Save the image or copy your scenario link.");
      } catch {
        if (!cancelled) {
          setPreparationFailed(true);
          setStatus(
            still
              ? "The image could not be prepared. Your scenario link still works. Try the image again below."
              : "The flight image could not be captured. Your scenario link still works. Replay to capture a new image.",
          );
        }
      }
    }
    void prepare();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [still, input, callsign, attempt]);

  function save() {
    if (!selected) return;
    const link = document.createElement("a");
    link.href = selected.url;
    link.download = selected.file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(
      `${format === "portrait" ? "Portrait" : "Landscape"} mission card downloaded. Your settings are printed on the image.`,
    );
  }

  async function share() {
    if (!selected?.shareable || sharing) return;
    // The File is already prepared: call the native sheet directly from this gesture.
    setSharing(true);
    try {
      await navigator.share({ files: [selected.file], title: "My cAshIo flight record", text: record.title });
      setStatus("Mission card shared.");
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? "Sharing cancelled. Your card is still ready to save."
          : "Sharing is unavailable here. Save the image or copy your scenario link.",
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className="ff-finale" aria-labelledby="ff-finale-title">
      <header className="ff-finale-intro">
        <p className="ff-eyebrow">FLIGHT COMPLETE / YOUR RECORD</p>
        <h3 id="ff-finale-title" tabIndex={-1} ref={headingRef}>
          The final say. <em>Still yours.</em>
        </h3>
      </header>
      <div className="ff-keepsake" data-format={format}>
        {selected ? (
          <img
            src={selected.preview}
            width={format === "portrait" ? 1080 : 1600}
            height={format === "portrait" ? 1440 : 1000}
            alt={`Your flight record${callsign ? ` for ${callsign}` : ""}: ${record.title} ${record.outcome.local} onboard, ${record.outcome.cloud} in cloud, ${record.outcome.held} held. ${record.connection}. ${record.permission}.`}
          />
        ) : (
          <div className="ff-keepsake-loading">
            <StarshipPoster eager />
            <span>Your flight record</span>
          </div>
        )}
        <div className="ff-card-formats" role="group" aria-label="Mission card format">
          <button type="button" aria-pressed={format === "portrait"} onClick={() => setFormat("portrait")}>
            Portrait <span>3:4</span>
          </button>
          <button type="button" aria-pressed={format === "landscape"} onClick={() => setFormat("landscape")}>
            Landscape <span>8:5</span>
          </button>
        </div>
        <div className="ff-finale-actions" data-native-share={selected?.shareable ? "true" : "false"}>
          <button type="button" className="ff-save" onClick={save} disabled={!selected}>
            Save mission card <span aria-hidden="true">↓</span>
          </button>
          {selected?.shareable && (
            <button type="button" className="ff-card-native" onClick={share} disabled={sharing}>
              {sharing ? "Opening share…" : "Share mission card"} <span aria-hidden="true">↗</span>
            </button>
          )}
          <button type="button" className="ff-share" onClick={onCopy}>
            {copied ? "Link copied ✓" : "Copy this scenario"}
          </button>
        </div>
        <p className="ff-finale-status" role="status">
          {status}
        </p>
        {preparationFailed && (
          <button
            type="button"
            className="ff-card-retry"
            onClick={() => {
              if (!still) {
                onReplay();
                return;
              }
              setCards({});
              setPreparationFailed(false);
              setStatus("Preparing your flight record…");
              setAttempt((value) => value + 1);
            }}
          >
            {still ? "Try preparing the image again" : "Replay to capture your card"}
          </button>
        )}
        <form
          className="ff-personalize"
          onSubmit={(event) => {
            event.preventDefault();
            const next = normalizeCallsign(draftCallsign);
            setDraftCallsign(next);
            if (next !== callsign) {
              setCards({});
              setPreparationFailed(false);
              setStatus("Preparing your personalized flight record…");
              setCallsign(next);
            }
          }}
        >
          <label htmlFor="ff-callsign">
            Your callsign <span>Optional</span>
          </label>
          <div>
            <input
              id="ff-callsign"
              value={draftCallsign}
              onChange={(event) => setDraftCallsign(event.target.value)}
              maxLength={48}
              autoComplete="off"
              spellCheck={false}
              placeholder="Your callsign"
              aria-describedby="ff-callsign-note"
            />
            <button type="submit" disabled={sharing || normalizeCallsign(draftCallsign) === callsign}>
              Apply
            </button>
          </div>
          <p id="ff-callsign-note">24 characters. Only on your image, never in your link.</p>
        </form>
      </div>
      <div className="ff-finale-copy">
        <p className="ff-finale-summary">{record.decision}</p>
        <dl className="ff-finale-metrics" aria-label="Final routing outcome">
          <div>
            <dt>Onboard</dt>
            <dd>{record.outcome.local.toString().padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Cloud</dt>
            <dd>{record.outcome.cloud.toString().padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Held</dt>
            <dd>{record.outcome.held.toString().padStart(2, "0")}</dd>
          </div>
        </dl>
        <details className="ff-finale-detail">
          <summary>
            Inspect the decision <span aria-hidden="true">+</span>
          </summary>
          {children}
        </details>
        <div className="ff-finale-next">
          <span className="ff-eyebrow">YOUR NEXT DEPARTURE</span>
          <button type="button" className="ff-roadster-next" onClick={() => onClose("roadster-studio")}>
            <img src="/images/roadster-studio-640.webp" width="640" height="360" alt="" loading="lazy" />
            <span>
              Roadster Studio<small>Explore the build from every angle →</small>
            </span>
          </button>
          <div className="ff-finale-links">
            <button type="button" onClick={onReplay}>
              Replay flight
            </button>
            <button type="button" onClick={() => onClose("contact")}>
              Compare notes with Doug →
            </button>
          </div>
          <details className="ff-finale-routes">
            <summary>
              More from the workshop <span aria-hidden="true">+</span>
            </summary>
            <div className="ff-finale-links">
              <button type="button" onClick={() => onClose(privateRequest)}>
                Test a private request →
              </button>
              <button type="button" onClick={() => onClose("smart-routing")}>
                See the real build story →
              </button>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
