import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FIRST_FLIGHT, flightStepIndex, missionHash } from "./flight-plan";
import { flightChapterInput, chapterRecap, type FlightChoices } from "./flight-state";
import { RequestConstellation } from "./request-constellation";
import { computeWorldOutcome } from "./sovereign-model";
import type { WorldController } from "./world-renderer";
import { StarshipPoster } from "./starship-poster";
import { FlightRecap } from "./flight-recap";
import { DecisionDelta } from "./decision-delta";
import type { FlightDecision } from "./flight-recap-model";
import { HumanReviewSignal } from "./human-review-signal";
import { MissionFinale } from "./mission-finale";
import { shareExperiment } from "./study-experiment";
import "./first-flight.css";

export default function FirstFlight({
  motion: globalMotion,
  initialStep,
  onClose,
  edition = "V37 / LIGHTFOLD",
  helios = false,
  visitorPaced = false,
  startTour = false,
  showcase = false,
}: {
  edition?: string;
  /** The current Helios front door: its recap, phone layout and contact exit. The V37 archive keeps the default. */
  helios?: boolean;
  visitorPaced?: boolean;
  /** Explicit tour entrance only; ordinary boarding and reduced motion remain visitor paced. */
  startTour?: boolean;
  /** Current front door only. Historical editions retain their existing composition and export. */
  showcase?: boolean;
  motion: boolean;
  initialStep: string;
  onClose: (destination?: string) => void;
}) {
  const [scenePaused, setScenePaused] = useState(false);
  const motion = globalMotion && !scenePaused;
  const [visit, setVisit] = useState(0);
  const remainingMs = useRef(FIRST_FLIGHT[flightStepIndex(initialStep)].durationMs);
  const timerChapter = useRef("");
  const [step, setStep] = useState(() => flightStepIndex(initialStep));
  const [paused, setPaused] = useState((visitorPaced && !startTour) || !motion || initialStep !== "board");
  const [phase, setPhase] = useState<"loading" | "ready" | "fallback">("loading");
  const [complete, setComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [cardStatus, setCardStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const captureGeneration = useRef(0);
  const captureBusy = useRef(false);
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [choice, setChoice] = useState<FlightChoices>({});
  const [lastDecision, setLastDecision] = useState<(FlightDecision & { step: number }) | null>(null);
  const [pageVisible, setPageVisible] = useState(true);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const panel = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<WorldController | null>(null);
  const initial = useRef(flightStepIndex(initialStep));
  const firstFocus = useRef<HTMLButtonElement>(null);
  const decisionFocus = useRef<HTMLButtonElement>(null);
  const restoreDecisionFocus = useRef(false);
  const completionFocus = useRef<HTMLHeadingElement>(null);
  const focusCompletion = useRef(false);
  const cinematicPause = useRef<HTMLButtonElement>(null);
  const manualPlayback = useRef<HTMLButtonElement>(null);
  const restorePlaybackFocus = useRef(false);
  const finaleStill = useRef<HTMLCanvasElement | null>(null);
  const scene = FIRST_FLIGHT[step];
  const currentInput = useMemo(() => flightChapterInput(step, choice), [step, choice]);
  const changed =
    currentInput.connected !== scene.input.connected ||
    currentInput.allowPrivateEgress !== scene.input.allowPrivateEgress;
  const currentDecision = lastDecision?.step === step ? lastDecision : null;
  const privateRequest = shareExperiment({
    study: "hermes",
    intent: "analyze",
    sources: true,
    privateData: true,
  }).slice(1);
  const recapDecision = helios
    ? chapterRecap(step, currentInput, lastDecision)
    : (lastDecision ?? { before: FIRST_FLIGHT[1].input, after: FIRST_FLIGHT[2].input });
  const input = complete ? recapDecision.after : currentInput;
  const displayStep = complete && !helios ? (lastDecision?.step ?? 2) : step;
  const displayScene = FIRST_FLIGHT[displayStep];
  const outcome = computeWorldOutcome(input);
  const independent = input.architecture === "hybrid" && !input.connected;
  const flightHash = changed || complete ? missionHash(input) : `#flight=${scene.id}`;
  const playing = motion && !paused && !complete && pageVisible && phase !== "loading";
  const cinema = showcase && motion && !paused && !complete;
  // In the Helios flight a relay choice carried from an earlier chapter keeps this chapter's own title.
  const changedHere = changed && (!helios || currentDecision !== null);
  const sceneTitle = complete
    ? "One boundary. A different outcome."
    : changedHere
      ? step === 3
        ? input.allowPrivateEgress
          ? "Permission changes the route."
          : "Your boundary holds."
        : input.connected
          ? "The relay is back."
          : "Connection lost. Work stays."
      : scene.title;

  const captureScene = useCallback(() => {
    controller.current?.setPlaying(false);
    if (phase === "ready" && controller.current) return controller.current.captureFrame();
    const poster = panel.current?.querySelector<HTMLImageElement>(".ff-fallback");
    if (!poster?.complete || !poster.naturalWidth) throw new Error("The ship image is still preparing.");
    const still = document.createElement("canvas");
    still.width = poster.naturalWidth;
    still.height = poster.naturalHeight;
    const paint = still.getContext("2d");
    if (!paint) throw new Error("Image export is unavailable.");
    paint.drawImage(poster, 0, 0);
    return still;
  }, [phase]);

  const finish = useCallback(
    (focus = true) => {
      if (showcase) {
        // Capture before the ending changes the stage layout or the renderer's dimensions.
        try {
          finaleStill.current = captureScene();
        } catch {
          finaleStill.current = null;
        }
      }
      focusCompletion.current = focus;
      setComplete(true);
      setPaused(true);
    },
    [showcase, captureScene],
  );

  useLayoutEffect(() => {
    if (!showcase || complete) return;
    const active = document.activeElement;
    if (
      restorePlaybackFocus.current ||
      (active instanceof HTMLElement && panel.current?.contains(active) && !active.getClientRects().length)
    ) {
      const control = (cinema ? cinematicPause : manualPlayback).current;
      (control?.disabled ? firstFocus.current : control)?.focus({ preventScroll: true });
      restorePlaybackFocus.current = false;
    }
  }, [showcase, cinema, complete]);

  useEffect(() => {
    const pending = downloads.current;
    return () => {
      captureGeneration.current += 1;
      pending.forEach((timer, url) => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      pending.clear();
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => {
      restoreDecisionFocus.current = document.activeElement === decisionFocus.current;
      setCompact(query.matches);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (restoreDecisionFocus.current) {
      decisionFocus.current?.focus({ preventScroll: true });
      restoreDecisionFocus.current = false;
    }
  }, [compact]);

  useLayoutEffect(() => {
    const story = panel.current?.querySelector<HTMLElement>(".ff-story");
    const body = panel.current?.querySelector<HTMLElement>(".ff-body");
    const stage = panel.current?.querySelector<HTMLElement>(".ff-stage");
    if (story) story.scrollTop = 0;
    if (body) body.scrollTop = complete && compact && !showcase ? (stage?.offsetHeight ?? 0) : 0;
    if (focusCompletion.current) {
      completionFocus.current?.focus({ preventScroll: true });
      focusCompletion.current = false;
    }
  }, [complete, compact, step, showcase]);

  useEffect(() => {
    const dialog = panel.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFocus.current?.focus();
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    let cancelled = false;
    void import("./world-renderer")
      .then(({ createSovereignWorld }) => {
        if (cancelled || !canvas.current) return;
        const first = FIRST_FLIGHT[initial.current];
        controller.current = createSovereignWorld(canvas.current, first.input, computeWorldOutcome(first.input), {
          inspect: () => {},
          unavailable: () => {
            if (!cancelled) setPhase("fallback");
          },
          viewChanged: () => setPaused(true),
        });
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("fallback");
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
      document.body.style.overflow = overflow;
      document.removeEventListener("visibilitychange", visibility);
      dialog?.close();
    };
  }, []);

  useEffect(() => {
    controller.current?.setMotion(motion);
    controller.current?.setCutaway(displayScene.hull);
    controller.current?.setFlightShot(displayScene.shot);
    controller.current?.select(displayScene.zone);
  }, [displayScene, motion, phase]);
  useEffect(() => {
    controller.current?.update(input, computeWorldOutcome(input));
  }, [input, phase]);
  useEffect(() => {
    controller.current?.setPlaying(playing);
  }, [playing, phase]);
  useEffect(() => {
    const chapter = `${step}-${visit}`;
    if (timerChapter.current !== chapter) {
      timerChapter.current = chapter;
      remainingMs.current = scene.durationMs;
    }
    if (!playing) return;
    const started = performance.now();
    const timer = setTimeout(() => {
      if (step < FIRST_FLIGHT.length - 1) {
        setCopied(false);
        setCopyError(false);
        setStep(step + 1);
      } else finish(showcase);
    }, remainingMs.current);
    return () => {
      clearTimeout(timer);
      remainingMs.current = Math.max(0, remainingMs.current - (performance.now() - started));
    };
  }, [playing, step, visit, scene.durationMs, finish, showcase]);

  function select(next: number) {
    captureGeneration.current += 1;
    setVisit((value) => value + 1);
    setStep(next);
    setPaused(true);
    setComplete(false);
    setCopied(false);
    setCopyError(false);
    setCardStatus("idle");
    finaleStill.current = null;
  }
  function replay() {
    select(0);
    setChoice({});
    setLastDecision(null);
    setPaused(showcase ? !motion : visitorPaced || !motion);
    // Replay removes the completed controls; return focus to a stable control.
    firstFocus.current?.focus({ preventScroll: true });
  }
  function reviewDecision() {
    finish();
  }
  async function saveCard() {
    if (captureBusy.current || phase === "loading") return;
    captureBusy.current = true;
    setPaused(true);
    setCardStatus("saving");
    const generation = captureGeneration.current;
    const selectedInput = { ...input };
    const selectedChapter = displayScene.title;
    try {
      const still = captureScene();
      const { createMissionCard } = await import("./mission-card");
      await document.fonts.ready;
      const { blob, record } = await createMissionCard(still, selectedInput, selectedChapter, {
        baseUrl: `${location.origin}${location.pathname}`,
        helios,
      });
      if (generation !== captureGeneration.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.filename;
      document.body.append(link);
      link.click();
      link.remove();
      const timer = setTimeout(() => {
        URL.revokeObjectURL(url);
        downloads.current.delete(url);
      }, 60_000);
      downloads.current.set(url, timer);
      setCardStatus("saved");
    } catch {
      if (generation === captureGeneration.current) setCardStatus("error");
    } finally {
      captureBusy.current = false;
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}${flightHash}`);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  const decisionButton = (
    <button
      ref={decisionFocus}
      className="ff-boundary-toggle"
      type="button"
      data-active={step === 3 ? input.allowPrivateEgress : !input.connected}
      onClick={() => {
        captureGeneration.current += 1;
        setCardStatus("idle");
        setPaused(true);
        setCopied(false);
        setCopyError(false);
        setLastDecision({
          step,
          before: { ...input },
          after:
            step === 3
              ? { ...input, allowPrivateEgress: !input.allowPrivateEgress }
              : { ...input, connected: !input.connected },
        });
        setChoice((previous) =>
          step === 3
            ? { ...previous, permitted: !input.allowPrivateEgress }
            : { ...previous, connected: !input.connected },
        );
      }}
    >
      <span aria-hidden="true">{step === 3 ? "◇" : "⌁"}</span>
      {step === 3
        ? input.allowPrivateEgress
          ? "Withdraw cloud permission"
          : "Permit these private requests"
        : input.connected
          ? "Cut the cloud link"
          : "Restore the cloud link"}
      {/* On the current site an up arrow marks only links that leave it; a toggle stays on the page. */}
      {!helios && <span aria-hidden="true">↗</span>}
    </button>
  );

  return (
    <dialog
      ref={panel}
      className={`first-flight ff-cinematic${showcase ? " ff-showcase" : ""}`}
      data-view={cinema ? "cinema" : "controls"}
      data-shot={displayScene.shot}
      data-motion={motion ? "on" : "off"}
      data-complete={complete}
      data-changed={changed}
      data-playback={playing ? "tour" : "manual"}
      aria-labelledby="ff-title"
      aria-describedby="ff-boundary"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (cinema) {
          event.preventDefault();
          restorePlaybackFocus.current = true;
          setPaused(true);
          return;
        }
        if (visitorPaced && playing) setPaused(true);
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), summary, a[href], input:not([disabled]), select:not([disabled]), [tabindex='0']",
          ),
        ].filter((control) => control.getClientRects().length > 0);
        if (event.shiftKey && document.activeElement === controls[0]) {
          event.preventDefault();
          controls.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
          event.preventDefault();
          controls[0]?.focus();
        }
      }}
    >
      <header className="ff-header">
        <div>
          <span className="ff-eyebrow">{edition}</span>
          <h2 id="ff-title">
            First contact. <em>Human command.</em>
          </h2>
        </div>
        {cinema && (
          <button
            className="ff-cinema-pause"
            ref={cinematicPause}
            type="button"
            onClick={() => {
              restorePlaybackFocus.current = true;
              setPaused(true);
            }}
          >
            Pause tour <span aria-hidden="true">Ⅱ</span>
          </button>
        )}
        <button ref={firstFocus} type="button" className="ff-close" onClick={() => onClose()}>
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      {helios && (
        <div className="ff-scene-tools">
          <p className="ff-scroll-cue">
            {playing ? `Tour · chapter ${step + 1} of 4` : compact ? "Scroll the scene ↓" : "3D flight · your pace"}
          </p>
          <button
            type="button"
            disabled={!globalMotion}
            onClick={() => {
              setScenePaused((value) => !value);
              setPaused(true);
            }}
          >
            {!globalMotion ? "Motion off" : scenePaused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
      )}
      <div className="ff-body">
        <div className={`ff-stage ff-stage-${phase}`} data-independent={independent}>
          <StarshipPoster imageClassName="ff-fallback" eager />
          <canvas ref={canvas} aria-hidden="true" />
          <div className="ff-stage-cap">
            <span>{helios ? "EXPLORER 01" : "CSV SOVEREIGN"}</span>
            <span>{input.connected ? "RELAY CONNECTED" : "RELAY OFFLINE"}</span>
          </div>
          <div className="ff-shot-reticle" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="ff-shot-label" aria-hidden="true">
            {independent
              ? "LINK LOST. WORK STAYS ABOARD."
              : [
                  "01 / ORBITAL APPROACH",
                  "02 / ONBOARD INTELLIGENCE",
                  "03 / THE INDEPENDENT SHIP",
                  "04 / THE HUMAN CORE",
                ][displayStep]}
          </span>
          <div
            key={`${step}-${input.connected}-${input.allowPrivateEgress}`}
            className="ff-telemetry"
            role="group"
            aria-label="Illustrated routing outcome"
          >
            <div>
              <strong>{outcome.local.toString().padStart(2, "0")}</strong>
              <span>Onboard</span>
            </div>
            <div>
              <strong>{outcome.cloud.toString().padStart(2, "0")}</strong>
              <span>Cloud</span>
            </div>
            <div>
              <strong>{outcome.held.toString().padStart(2, "0")}</strong>
              <span>Held</span>
            </div>
          </div>
          {showcase && (
            <div className="ff-film-caption" aria-hidden={!cinema}>
              <span className="ff-eyebrow">
                0{step + 1} / 04 · {phase === "loading" ? "PREPARING THE SHIP" : "FIRST FLIGHT"}
              </span>
              <h3 key={sceneTitle}>{sceneTitle}</h3>
              <p>
                {
                  [
                    changed
                      ? outcome.summary
                      : "Twelve requests. Private work stays aboard. Public work can reach the cloud.",
                    "The hull opens. The intelligence is yours to inspect.",
                    changed ? outcome.summary : "The cloud goes dark. This ship keeps the work aboard.",
                    changed
                      ? outcome.summary
                      : "Twelve private requests. Cloud only. Nothing leaves without permission.",
                  ][step]
                }
              </p>
              <div className="ff-film-progress" aria-label={`Chapter ${step + 1} of 4`}>
                {FIRST_FLIGHT.map((chapter, index) => (
                  <span key={`${chapter.id}-${visit}`} data-passed={index < step} data-active={index === step}>
                    <i
                      style={{
                        animationDuration: `${scene.durationMs}ms`,
                        animationPlayState: playing ? "running" : "paused",
                      }}
                    />
                  </span>
                ))}
              </div>
              <span className="ff-film-hint">Pause to take command</span>
            </div>
          )}
        </div>
        <section className="ff-story" aria-labelledby="ff-scene-title">
          <span className="ff-eyebrow">
            0{step + 1} / 04 ·{" "}
            {complete
              ? "FLIGHT COMPLETE"
              : phase === "loading"
                ? "PREPARING THE SHIP"
                : ["BOARD", "OPEN THE HULL", "CUT THE CLOUD", "HUMAN COMMAND"][step]}
          </span>
          <h3 id="ff-scene-title" ref={showcase && complete ? undefined : completionFocus} tabIndex={-1}>
            {sceneTitle}
          </h3>
          {complete ? (
            <>
              <FlightRecap
                decision={recapDecision}
                visitorChoice={helios ? currentDecision !== null : lastDecision !== null}
                wording={
                  helios && step === 3 && !currentDecision
                    ? {
                        eyebrow: "THE LAST CHAPTER, BOTH WAYS",
                        captions: ["If you say yes", "If you say no"],
                        before: "Permission on",
                        after: "Permission off",
                        note: "Same twelve private requests. Only your permission changes the route.",
                      }
                    : undefined
                }
              />
              {outcome.held > 0 && <HumanReviewSignal motion={motion && pageVisible} />}
              <div className="ff-next">
                {!compact && (
                  <button className="ff-next-primary" type="button" onClick={() => onClose(privateRequest)}>
                    Test a private request →
                  </button>
                )}
                <button type="button" onClick={() => onClose("smart-routing")}>
                  See the real build story →
                </button>
                {helios && (
                  <button type="button" onClick={() => onClose("contact")}>
                    Compare notes with Doug →
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="ff-command-lab">
                {changed && currentDecision && <DecisionDelta decision={currentDecision} />}
                <div className="ff-lab-heading">
                  <span>TAKE COMMAND</span>
                  <span>LOCAL ILLUSTRATION</span>
                </div>
                {!compact && decisionButton}
                <p className="ff-scene-copy">{changed && step !== 1 ? outcome.summary : scene.copy}</p>
                <p className="ff-state-note">
                  {step === 3
                    ? "New scenario: cloud connected, twelve private requests. Your permission choice is kept when you revisit this chapter."
                    : choice.connected !== undefined
                      ? `Your relay choice is kept in chapters 1 to 3: ${input.connected ? "connected" : "disconnected"}.`
                      : "Chapters 1 to 3 share your relay choice. Chapter 4 starts a separate permission test."}
                </p>
                <details className="ff-request-detail" open={!compact && !changed}>
                  <summary>
                    Follow the twelve requests <span aria-hidden="true">+</span>
                  </summary>
                  <RequestConstellation input={input} motion={motion && pageVisible} />
                </details>
                <p className="ff-decision-result">
                  {outcome.local} onboard · {outcome.cloud} in cloud · {outcome.held} held
                  {step === 3 && (
                    <small>
                      {input.allowPrivateEgress
                        ? "Permission granted in this illustration. Private data can leave the ship."
                        : "Permission is off. Private requests wait for your decision."}
                    </small>
                  )}
                </p>
                {outcome.held > 0 && <HumanReviewSignal motion={motion && pageVisible} />}
                {changed && (
                  <button
                    className="ff-restore-scene"
                    type="button"
                    onClick={() => {
                      captureGeneration.current += 1;
                      setCardStatus("idle");
                      setChoice((previous) =>
                        step === 3 ? { connected: previous.connected } : { permitted: previous.permitted },
                      );
                      if (lastDecision?.step === step) setLastDecision(null);
                      setCopied(false);
                      setCopyError(false);
                    }}
                  >
                    Reset this chapter ↺
                  </button>
                )}
              </div>
              <strong className="ff-takeaway">{changed ? outcome.takeaway : scene.takeaway}</strong>
              {changed && !compact && (
                <button className="ff-review-decision" type="button" onClick={reviewDecision}>
                  Skip to the ending →
                </button>
              )}
            </>
          )}
          {(complete || changed) && (
            <p className="ff-memento">Keep your decision: save a mission image or copy a link to this scenario.</p>
          )}
          <p className="ff-card-status" role="status">
            {cardStatus === "saving"
              ? "Preparing your mission card…"
              : cardStatus === "saved"
                ? "Mission card downloaded. Your settings are printed on the card."
                : cardStatus === "error"
                  ? "The card could not be saved. Try again, or copy the scenario link."
                  : ""}
          </p>
        </section>
      </div>
      {showcase && complete && (
        <MissionFinale
          still={finaleStill.current}
          input={input}
          headingRef={completionFocus}
          copied={copied}
          onCopy={copy}
          onReplay={replay}
          onClose={onClose}
          privateRequest={privateRequest}
        >
          <FlightRecap
            decision={recapDecision}
            visitorChoice={currentDecision !== null}
            wording={
              step === 3 && !currentDecision
                ? {
                    eyebrow: "THE LAST CHAPTER, BOTH WAYS",
                    captions: ["If you say yes", "If you say no"],
                    before: "Permission on",
                    after: "Permission off",
                    note: "Same twelve private requests. Only your permission changes the route.",
                  }
                : undefined
            }
          />
        </MissionFinale>
      )}
      {compact && (
        <div className="ff-mobile-command">
          {complete ? (
            <button className="ff-boundary-toggle" type="button" onClick={() => onClose(privateRequest)}>
              Test a private request →
            </button>
          ) : changed ? (
            <button
              ref={decisionFocus}
              className="ff-boundary-toggle ff-review-decision"
              type="button"
              onClick={reviewDecision}
            >
              Skip to the ending <span aria-hidden="true">→</span>
            </button>
          ) : (
            decisionButton
          )}
        </div>
      )}
      {helios && compact && !complete && (
        <select
          className="ff-chapter-picker"
          aria-label="Flight chapter"
          value={step}
          onChange={(event) => select(Number(event.target.value))}
        >
          {FIRST_FLIGHT.map((item, index) => (
            <option key={item.id} value={index}>
              {index + 1} / 4 · {["Board", "Open the hull", "Cut the cloud", "Human command"][index]}
            </option>
          ))}
        </select>
      )}
      <nav className="ff-chapters" aria-label="Flight chapters" hidden={complete || (helios && compact)}>
        {FIRST_FLIGHT.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-current={step === index ? "step" : undefined}
            onClick={() => select(index)}
          >
            <span className="ff-chapter-number">0{index + 1}</span>
            <span className="ff-chapter-name">
              {["Board", "Open the hull", "Cut the cloud", "Human command"][index]}
            </span>
            <span className="ff-chapter-short">
              {
                (helios
                  ? ["Board", "Open the hull", "Cut the cloud", "Human command"]
                  : ["Board", "Hull", "Blackout", "Command"])[index]
              }
            </span>
            <i
              key={`${step}-${visit}`}
              style={{ animationPlayState: playing ? "running" : "paused", animationDuration: `${scene.durationMs}ms` }}
              className={step === index && motion && !complete ? "ff-progress" : ""}
            />
          </button>
        ))}
      </nav>
      <footer className="ff-footer">
        <div className="ff-playback">
          {!complete && (
            <button
              type="button"
              aria-label="Previous chapter"
              onClick={() => select(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              ← <span>Previous</span>
            </button>
          )}
          <button
            ref={manualPlayback}
            type="button"
            disabled={phase === "loading" || (!complete && !motion)}
            onClick={() => {
              if (complete) replay();
              else {
                if (showcase) restorePlaybackFocus.current = true;
                setPaused(!paused);
              }
            }}
          >
            {complete
              ? "Replay flight"
              : !motion
                ? "Manual flight"
                : playing
                  ? visitorPaced
                    ? "Pause tour"
                    : "Pause flight"
                  : visitorPaced
                    ? "Play tour"
                    : "Resume flight"}
          </button>
          {!complete && (
            <button
              type="button"
              onClick={() => {
                if (step === 3) {
                  finish();
                } else select(step + 1);
              }}
            >
              {step === 3 ? "Finish" : "Next"} →
            </button>
          )}
        </div>
        <button
          className="ff-save"
          type="button"
          onClick={saveCard}
          disabled={phase === "loading"}
          aria-disabled={cardStatus === "saving" || undefined}
          aria-busy={cardStatus === "saving" || undefined}
          aria-label="Save mission card"
          title="Save mission card"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
          </svg>
          <span>Save mission card</span>
        </button>
        <button
          className="ff-share"
          type="button"
          onClick={copy}
          aria-label={copied ? "Link copied" : changed || complete ? "Copy this scenario" : "Copy this flight"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="1" />
            <path d="M15 5V3H3v12h2" />
          </svg>
          <span>{copied ? "Link copied ✓" : changed || complete ? "Copy this scenario" : "Copy this flight"}</span>
        </button>
      </footer>
      <p className="ff-boundary" id="ff-boundary">
        {helios && compact ? "Local demo · no requests sent." : "Demo runs in your browser. No AI requests sent."}{" "}
        {phase === "fallback" ? "The 3D view is unavailable; the illustrated outcomes still work. " : ""}
        {helios && compact
          ? complete
            ? "Replay or save your card."
            : ""
          : !motion
            ? complete
              ? "Motion stays off on replay."
              : "Motion off. Use Next."
            : helios && complete
              ? "Replay, save your card or test a private request."
              : visitorPaced
                ? playing
                  ? "30 second tour. Any decision pauses it."
                  : "Your pace. Use Next, or play the 30 second tour."
                : "Explore at your own pace."}
      </p>
      <span className="o-sr-only" role="status" aria-atomic="true">
        {complete ? "Flight complete." : sceneTitle} {outcome.local} onboard, {outcome.cloud} in cloud, {outcome.held}{" "}
        held.
        {outcome.held > 0 ? " A person must approve the next route." : ""}
      </span>
      {copyError && (
        <label className="ff-copy-error">
          <span role="status">Clipboard unavailable. Select and copy your scene link:</span>
          <input
            aria-label="Scene link"
            readOnly
            value={`${location.origin}${location.pathname}${flightHash}`}
            onFocus={(event) => {
              const field = event.currentTarget;
              requestAnimationFrame(() => {
                if (document.activeElement === field) field.select();
              });
            }}
            onClick={(event) => event.currentTarget.select()}
          />
        </label>
      )}
    </dialog>
  );
}
