import { useCallback, useMemo, useState, type CSSProperties, type RefObject } from "react";
import {
  ARTICLES,
  EXPIRES_SHORT,
  HOSTS,
  LANES,
  LAWS,
  LINEAGE,
  LINEAGE_EVIDENCE,
  NAMED_ROLES,
  PILOT_CRAFT,
  PVE,
  ROUTING_STAGES,
  ROUTING_VERIFIED_LONG,
  SERVICE_FAMILIES,
  VERIFIED_LONG,
  WITHHELD,
  DECK_CRAFT,
} from "@/lib/content";
import { getSound } from "@/lib/sound";
import { useDeck } from "@/lib/store";
import { BlackBoxReceipt } from "./black-box-receipt";
import { BitMascot } from "./bit-mascot";
import { BuildEnvelope } from "./build-envelope";
import { CountUp, DeckShell, Kicker, Plate, Ticker, Title } from "./deck-primitives";
import { EveConsole } from "./eve-console";

type SecRef = RefObject<HTMLElement | null>;

export const IDENTITY_LINE = "DOUG CASHIO · ENTERPRISE AI + SECURITY SYSTEMS · OWNER-OPERATOR";

export function DeckSnapshot({
  s0,
  copyCol,
  onEngage,
  onEve,
}: {
  s0: SecRef;
  copyCol: RefObject<HTMLDivElement | null>;
  onEngage: () => void;
  onEve: () => void;
}) {
  const mode = useDeck((s) => s.mode);
  const set = useDeck((s) => s.set);
  return (
    <section
      ref={s0}
      data-deck={0}
      tabIndex={-1}
      aria-label="SNAPSHOT deck"
      className="za-mobile-rail-clearance relative min-h-[100dvh] px-5 pb-32 pt-24 md:px-10 lg:px-14"
    >
      <div ref={copyCol} className="za-bracket max-w-[38rem] p-2">
        <Kicker>ZEUSAPOLLO · SOVEREIGN AI UNDER HUMAN COMMAND</Kicker>
        <p className="za-mono mt-3 text-[11px] tracking-[0.12em] text-cyan">{IDENTITY_LINE}</p>
        <h1 tabIndex={-1} className="za-display text-[clamp(2rem,4.8vw,4.4rem)] leading-[0.92]">
          OWN THE IRON AND THE <span className="za-shimmer-text">ROUTE</span>.
        </h1>
        <p className="za-mono mt-5 text-[11px] text-dim">
          18/19 AT 28 AUG PROBE · ZEUS 12/13 · APOLLO 6/6 · 2 HOSTS QUORATE · READ-ONLY DATED EXPORT
        </p>
        <p className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
          Owned compute keeps the evidence close. Quality-first routing picks the right model; dated export rules keep
          the claim bounded; one accountable operator keeps human authority in the loop. Fleet evidence was verified on{" "}
          {VERIFIED_LONG}; routing inventory remains separately dated {ROUTING_VERIFIED_LONG}.
        </p>

        <div
          data-hud-clear
          className="za-snapshot-modes mt-8 grid max-w-lg grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-line bg-void-2/70 p-1.5"
        >
          <button
            type="button"
            aria-pressed={mode === "technical"}
            onClick={() => {
              set({ mode: "technical", shown: [0] });
              getSound().prompt();
            }}
            className={`rounded-[10px] px-3 py-3 text-left ${mode === "technical" ? "bg-accent text-on-accent" : "text-dim"}`}
          >
            <div className="za-mono text-[10px] tracking-[0.2em]">TECHNICAL</div>
            <div className="mt-1 font-sans text-[13px] leading-snug">
              Detailed evidence, build proof, and operational context.
            </div>
          </button>
          <button
            type="button"
            aria-pressed={mode === "executive"}
            onClick={() => {
              set({ mode: "executive", shown: [0, 8] });
              getSound().prompt();
            }}
            className={`rounded-[10px] px-3 py-3 text-left ${mode === "executive" ? "bg-accent text-on-accent" : "text-dim"}`}
          >
            <div className="za-mono text-[10px] tracking-[0.2em]">EXECUTIVE</div>
            <div className="mt-1 font-sans text-[13px] leading-snug">
              Route control, evidence boundary, human authority.
            </div>
          </button>
        </div>

        <div data-hud-clear className="za-snapshot-actions mt-8 flex flex-wrap items-center gap-3">
          <button type="button" className="za-btn px-7 py-3.5 text-[13px]" onClick={onEngage}>
            {mode === "executive" ? "READ THE BRIEF" : "DESCEND THE DECKS"}
          </button>
          <button type="button" className="za-btn-ghost px-5 py-3 text-[11px]" onClick={onEve}>
            OPEN E.V.E. CONSOLE
          </button>
        </div>

        <div data-hud-clear className="za-chip za-critical-telemetry mt-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
          E.V.E. ONLINE · READ-ONLY · DATED EXPORT · VERIFIED {VERIFIED_LONG} · VALID THRU {EXPIRES_SHORT}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["ZEUS", 12, "OF 13 AT PROBE"],
            ["APOLLO", null, "6/6 AT 28 AUG PROBE"],
            ["ATLAS", null, "GATEWAY · LOCAL INFERENCE"],
            ["ATHENA", null, "QUORUM SUPPORT"],
            ["GENESIS", null, "PRIVATE STORAGE · RECOVERY"],
          ].map(([n, c, r]) => (
            <div key={String(n)} className={`za-panel px-3 py-3 ${n === "GENESIS" ? "col-span-2 sm:col-span-1" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="za-display text-[15px] text-cyan">{n}</div>
                <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
              </div>
              <div className="za-mono mt-1 text-[9px] text-dim">
                {c != null ? (
                  <>
                    <CountUp to={c as number} /> {r as string}
                  </>
                ) : (
                  (r as string)
                )}
              </div>
              <div className="za-heartbeat mt-2" aria-hidden />
            </div>
          ))}
        </div>
        <Ticker />
      </div>
    </section>
  );
}

export function DeckBrief({ sBrief }: { sBrief: SecRef }) {
  return (
    <DeckShell index={0} sRef={sBrief}>
      <div className="grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Kicker>WHAT THIS ACTUALLY MEANS FOR A BUSINESS</Kicker>
          <Title>THREE OUTCOMES. ONE HUMAN COMMAND.</Title>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">01 · ROUTE CONTROL</div>
              <div className="za-display mt-3 text-5xl text-cyan">
                <CountUp to={18} />
                /19
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Quality-first routing turns capability into a controlled decision. The 21 August 2026 routing inventory
                counts ten public lanes and thirty-six private catalog entries as different objects.
              </p>
            </article>
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">02 · EVIDENCE BOUNDARY</div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                18 of 19 documented guests were running at the 28 August probe. Two Proxmox hosts were online and
                quorate. The dated export is evidence, never telemetry.
              </p>
            </article>
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">03 · HUMAN AUTHORITY</div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Owned compute and bounded autonomy leave a person accountable for routing, reliability, and the next
                decision.
              </p>
            </article>
          </div>
        </div>
        <div className="relative hidden md:block">
          <Plate
            src="/plates/command.jpg?v=48"
            alt="Command viewscreen over a starfield"
            className="h-[min(56vh,480px)] w-full"
            chip="VIEWSCREEN · DEFIANT CLASS"
          />
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckGrid({
  s1,
  hubZ,
  hubA,
  pathZeus,
  pathApollo,
}: {
  s1: SecRef;
  hubZ: RefObject<HTMLDivElement | null>;
  hubA: RefObject<HTMLDivElement | null>;
  pathZeus: string;
  pathApollo: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [lock, setLock] = useState<number | null>(null);
  const withheld = Array.from({ length: 12 }, (_, i) => i + 8);
  const locked = lock != null ? NAMED_ROLES[lock] : null;

  return (
    <DeckShell index={1} sRef={s1}>
      <div className="relative max-w-5xl">
        <Kicker>02 · THE GRID</Kicker>
        <Title>WHAT IS ACTUALLY RUNNING</Title>
        <p className="mt-5 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
          Nineteen documented roles. At the 28 August probe Zeus ran 12 of 13 and Apollo ran 6 of 6. Seven observed role
          families are named here; the stopped guest stays unnamed and the remaining roles stay public-safe.
        </p>

        <div className="relative mt-8">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
            style={{ display: pathZeus || pathApollo ? "block" : "none" }}
          >
            <path d={pathZeus} className="za-flow-path" />
            <path d={pathApollo} className="za-flow-path cool" />
            {pathZeus ? (
              <>
                <circle r="3.4" className="za-packet" style={{ offsetPath: `path('${pathZeus}')` }} />
                <circle
                  r="2.6"
                  className="za-packet"
                  style={{ offsetPath: `path('${pathZeus}')`, animationDelay: "1.1s" }}
                />
                <circle
                  r="2.2"
                  className="za-packet"
                  style={{ offsetPath: `path('${pathZeus}')`, animationDelay: "2.2s" }}
                />
              </>
            ) : null}
            {pathApollo ? (
              <>
                <circle r="3.4" className="za-packet cool" style={{ offsetPath: `path('${pathApollo}')` }} />
                <circle
                  r="2.4"
                  className="za-packet cool"
                  style={{ offsetPath: `path('${pathApollo}')`, animationDelay: "1.5s" }}
                />
              </>
            ) : null}
          </svg>
          <div className="flex flex-wrap gap-3">
            <div
              ref={hubZ}
              className={`za-panel za-hub warm px-5 py-4 ${locked?.hub === "zeus" ? "border-accent" : ""}`}
            >
              <div className="za-display text-xl text-accent">ZEUS</div>
              <div className="za-mono mt-1 text-[10px] text-dim">12/13 AT 28 AUG PROBE</div>
            </div>
            <div
              ref={hubA}
              className={`za-panel za-hub cool px-5 py-4 ${locked?.hub === "apollo" ? "border-cyan" : ""}`}
            >
              <div className="za-display text-xl text-cyan">APOLLO</div>
              <div className="za-mono mt-1 text-[10px] text-dim">6/6 AT 28 AUG PROBE</div>
            </div>
          </div>
        </div>

        <div data-hud-clear className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
          {NAMED_ROLES.map((r, i) => (
            <button
              key={r.name + r.role}
              type="button"
              data-hub={r.hub}
              onMouseEnter={() => {
                setHover(i);
                getSound().target((i / 7 - 0.5) * 1.2);
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                setLock(i);
                getSound().ok();
              }}
              className={`za-panel p-4 text-left transition-colors ${hover === i || lock === i ? "border-accent" : ""}`}
            >
              <div className="za-mono text-[9px] text-dim">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 font-display text-[13px] tracking-wide text-ink">{r.name}</div>
              <div className="za-mono mt-1 text-[9px] text-cyan">{r.role}</div>
              <div className="za-mono mt-2 text-[9px] text-dim">{r.hub.toUpperCase()}</div>
            </button>
          ))}
          {withheld.map((n) => (
            <div key={n} className="za-panel border-dashed p-4 opacity-70">
              <div className="za-mono text-[9px] text-dim">ROLE {String(n).padStart(2, "0")}</div>
              <div className="mt-2 h-2 w-24 rounded-full bg-white/10" />
              <div className="za-mono mt-2 text-[9px] text-dim">PUBLIC-SAFE · NOT ITEMIZED</div>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-muted">{SERVICE_FAMILIES}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-[11px]">
          <span className="za-chip">18/19 AT 28 AUG PROBE</span>
          <span className="za-chip">2 HOSTS ONLINE · QUORATE</span>
          <span className="za-chip">READ-ONLY · DATED EXPORT</span>
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckRouting({ s2 }: { s2: SecRef }) {
  const [active, setActive] = useState(1);
  const lane = LANES[active];
  return (
    <DeckShell index={2} sRef={s2}>
      <div className="max-w-5xl">
        <Kicker>03 · ROUTING</Kicker>
        <Title>QUALITY PICKS THE MODEL.</Title>
        <p className="mt-2 za-display text-[clamp(1.2rem,2.4vw,2rem)] text-accent">COST ONLY BREAKS A TIE.</p>
        <p className="mt-5 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
          Quality picks the model. Cost only breaks a tie. Public capability lanes and private catalog entries count
          different objects; both were last confirmed in the {ROUTING_VERIFIED_LONG} routing inventory. This is a dated
          counting rule, not a live provider status board.
        </p>

        <div data-hud-clear className="mt-10 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-1.5">
            {LANES.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setActive(i);
                  getSound().ok();
                  getSound().target((i / LANES.length - 0.5) * 1.4);
                }}
                data-model={l.tid || undefined}
                className={`flex min-h-11 items-center gap-4 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors ${
                  active === i ? "border-accent bg-accent/10" : "border-line bg-void-2/50 hover:border-cyan/40"
                }`}
              >
                <span className="za-mono w-10 text-[11px] text-accent">{l.id}</span>
                <span className="flex-1 font-display text-[12px] tracking-wide">{l.name}</span>
                <span className="za-mono hidden text-[10px] text-dim sm:inline">{l.model}</span>
              </button>
            ))}
          </div>
          <div className="za-panel relative overflow-hidden p-6">
            <div className="za-kicker">LANE {lane.id} · COMMITTED</div>
            <h3 className="za-display mt-3 text-3xl">{lane.name}</h3>
            <p className="za-mono mt-2 text-[12px] text-cyan">{lane.model}</p>
            <p className="mt-5 max-w-[42ch] text-[1.02rem] leading-relaxed text-muted">{lane.use}</p>

            <div className="mt-7">
              <div className="za-mono mb-2 text-[9px] tracking-[0.22em] text-dim">ROUTING COMPUTER · FIVE STAGES</div>
              {ROUTING_STAGES.map(([n, label, detail], i) => (
                <div key={n}>
                  {i > 0 ? <div className="za-law-join" /> : null}
                  <div className={`za-law-step ${i <= Math.min(active, ROUTING_STAGES.length - 1) ? "on" : ""}`}>
                    <span className="za-law-dot" />
                    <span className="za-mono text-[10px] text-accent">{n}</span>
                    <span className="font-display text-[11px] tracking-wide text-ink">{label}</span>
                    <span className="ml-auto hidden za-mono text-[9px] text-dim sm:inline">{detail}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan to-accent transition-all duration-500"
                style={{ width: `${((active + 1) / LANES.length) * 100}%` }}
              />
            </div>
            <p className="za-mono mt-4 text-[10px] leading-relaxed text-dim">
              ROUTING INVENTORY {ROUTING_VERIFIED_LONG.toUpperCase()} — TEN PUBLIC CAPABILITY LANES AND 36 PRIVATE
              CATALOG ENTRIES COUNT DIFFERENT OBJECTS. DATED POLICY, NOT LIVE PROVIDER STATUS.
            </p>
          </div>
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckIron({ s3 }: { s3: SecRef }) {
  const [probe, setProbe] = useState(0);
  const host = HOSTS[probe] ?? HOSTS[0];
  return (
    <DeckShell index={3} sRef={s3}>
      <div className="grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Kicker>04 · THE IRON</Kicker>
          <Title>HARDWARE IN A ROOM I CAN WALK INTO.</Title>
          <p className="mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-muted">
            ZeusApollo ran Proxmox VE {PVE} across two online, quorate hosts at the dated probe. The public export
            intentionally omits hardware and recovery implementation details. Click a host. The plate holds the lock.
          </p>
          <div data-hud-clear className="mt-8 grid gap-3 sm:grid-cols-2">
            {HOSTS.map((h, i) => (
              <button
                key={h.name}
                type="button"
                onClick={() => {
                  setProbe(i);
                  getSound().target((i / 4 - 0.5) * 1.2);
                }}
                className={`za-panel p-5 text-left ${probe === i ? "border-accent" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="za-display text-xl text-cyan">{h.name}</div>
                  <span className="za-chip">
                    <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
                    {h.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{h.blurb}</p>
                <div className="za-heartbeat mt-3" aria-hidden />
              </button>
            ))}
          </div>
          <div className="mt-6 za-panel p-5">
            <div className="za-kicker text-red">WITHHELD — NO FRESH MEASUREMENT</div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {WITHHELD.map((w) => (
                <li key={w} className="za-mono text-[11px] text-dim">
                  — {w.toUpperCase()}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              A figure with no fresh measurement is omitted entirely rather than published stale. Owner-run verification
              probe over cluster SSH by E.V.E. — a dated public-safe snapshot, not streaming telemetry. This page makes
              no production network calls.
            </p>
          </div>
        </div>
        <Plate
          src="/plates/rack.jpg?v=48"
          alt="Conceptual server-rack visualization with cyan and amber status lights"
          className="h-[min(72vh,640px)] w-full"
          chip={`CONCEPT VISUAL · ${host.name} · ${host.tag}`}
        />
      </div>
    </DeckShell>
  );
}

export function DeckLineage({ s4 }: { s4: SecRef }) {
  const lock = useDeck((s) => s.craftLock);
  const set = useDeck((s) => s.set);
  const lockedPilot = lock == null ? -1 : PILOT_CRAFT.indexOf(lock);
  const defaultPilot = PILOT_CRAFT.indexOf(DECK_CRAFT[4]);
  const pick = lockedPilot >= 0 ? lockedPilot : Math.max(0, defaultPilot);
  const active = LINEAGE[pick];
  const evidence = LINEAGE_EVIDENCE[pick];
  return (
    <DeckShell index={4} sRef={s4}>
      <div className="max-w-6xl">
        <Kicker>05 · LINEAGE</Kicker>
        <Title>FOUR FLIGHT-TEST MINDS. FOUR RULES.</Title>
        <p className="mt-5 max-w-[58ch] text-[1.05rem] leading-relaxed text-muted">
          Four disciplines shaped this program: find the edge, simplify the machine, question the shape, and fly with
          precision. Select a lineage; the viewscreen acquires its airframe and the operating rule resolves.
        </p>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-hud-clear className="relative flex flex-col gap-2">
            <div className="za-spine" aria-hidden />
            {LINEAGE.map((l, i) => (
              <button
                key={l.name}
                type="button"
                aria-pressed={pick === i}
                onClick={() => {
                  set({ craftLock: PILOT_CRAFT[i] });
                  getSound().craft(PILOT_CRAFT[i], "lineage");
                }}
                onMouseEnter={() => getSound().target((i / 3 - 0.5) * 1.2)}
                className={`za-panel za-pilot p-5 pl-8 text-left ${pick === i ? "on" : ""}`}
              >
                <div className="za-mono text-[10px] text-accent">
                  {String(i + 1).padStart(2, "0")} · {l.craft}
                </div>
                <h3 className="za-display mt-2 text-2xl">{l.name}</h3>
                <p className="mt-2 text-sm leading-snug text-muted">{l.rule}</p>
              </button>
            ))}
          </div>
          <article
            key={active.name}
            data-hud-clear
            className="za-panel za-lineage-dossier relative overflow-hidden p-7"
          >
            <div className="za-kicker">CASHIO OPERATING LESSON {String(pick + 1).padStart(2, "0")} / 04</div>
            <h3 className="za-display mt-4 text-[clamp(1.8rem,3.4vw,3rem)]">{active.name}</h3>
            <p className="mt-5 text-xl leading-snug text-ink">{active.rule}</p>
            <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-muted">{active.note}</p>
            <section className="za-airframe-evidence mt-7" aria-label={`${active.name} aircraft evidence`}>
              <figure>
                <div className="za-airframe-frame">
                  <img
                    src={evidence.src}
                    alt={evidence.alt}
                    className="za-airframe-photo"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="za-airframe-grid" aria-hidden />
                  <span className="za-airframe-acquire" aria-hidden />
                  <span className="za-chip za-airframe-label">{evidence.label}</span>
                </div>
                <figcaption className="za-airframe-credit">
                  <span>{evidence.credit} · OFFICIAL FLIGHT PHOTOGRAPH</span>
                  <span className="za-airframe-sources">
                    <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                      PHOTO ↗
                    </a>
                    {evidence.dataUrl !== evidence.sourceUrl ? (
                      <a href={evidence.dataUrl} target="_blank" rel="noreferrer">
                        DATA ↗
                      </a>
                    ) : null}
                  </span>
                </figcaption>
              </figure>
              <div className="za-airframe-facts" aria-label={`${active.craft} specifications`}>
                {evidence.facts.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <p className="za-mono mt-8 text-[10px] text-dim">AIRFRAME LOCKED · {active.craft}</p>
            <div className="za-chip mt-5">
              <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
              CLEARED TO FLY · RULE {String(pick + 1).padStart(2, "0")} / 04
            </div>
          </article>
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckBuilds({ s5, onSelect }: { s5: SecRef; onSelect: (article: number) => void }) {
  const sel = useDeck((s) => s.sel);
  const article = ARTICLES[sel];
  const lock = useCallback(
    (i: number) => {
      onSelect(i);
    },
    [onSelect],
  );
  return (
    <DeckShell index={5} sRef={s5}>
      <div className="max-w-6xl">
        <Kicker>06 · BUILDS</Kicker>
        <Title>SEVEN TEST ARTICLES.</Title>
        <p className="mt-5 max-w-[58ch] text-[1.05rem] leading-relaxed text-muted">
          Owner-built evidence, not universal status claims. Seven documented builds on the same fabric. Select a marker
          or article to acquire its proof vector; arrow keys fly the range.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div data-hud-clear className="za-build-details">
            <div key={article.name} className="za-panel za-article-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="za-mono text-[10px] text-accent">
                  {String(sel + 1).padStart(2, "0")} · {article.tag}
                </div>
                <span className="za-chip text-[9px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                  TARGET LOCK
                </span>
              </div>
              <h3 className="za-display mt-3 text-3xl">{article.name}</h3>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">{article.note}</p>
              <div className="za-article-telemetry mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-sm)] border border-line">
                <span>ARTICLE · {String(sel + 1).padStart(2, "0")}/07</span>
                <span>BUILD PROOF · OWNER-BUILT</span>
                <span>CONTROL · MANUAL</span>
              </div>
            </div>
            <div className="za-build-selector mt-3 flex flex-col" role="group" aria-label="Select a test article">
              {ARTICLES.map((a, i) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => lock(i)}
                  aria-pressed={i === sel}
                  aria-label={`Article ${i + 1} of 7, ${a.name}, ${a.tag}`}
                  className={`za-build-row flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left ${
                    i === sel ? "on" : ""
                  }`}
                >
                  <span className="za-build-index za-mono w-6 text-[10px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-[12px] tracking-wide">{a.name}</span>
                  <span className="za-mono text-[9px] text-dim">{a.tag}</span>
                </button>
              ))}
            </div>
          </div>
          <div data-hud-clear className="za-build-map">
            <BuildEnvelope sel={sel} onLock={lock} />
          </div>
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckOperator({ s6 }: { s6: SecRef }) {
  const [lawI, setLawI] = useState(0);
  return (
    <DeckShell index={6} sRef={s6}>
      <div className="grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <Plate
          src="/plates/operator.jpg?v=48"
          alt="Empty command chair facing the viewscreen"
          className="h-[min(70vh,620px)] w-full"
          fade="right"
          chip="THE CHAIR · HUMAN ACCOUNTABLE"
        />
        <div>
          <Kicker>07 · OPERATOR</Kicker>
          <Title>DOUG CASHIO</Title>
          <p className="za-mono mt-3 text-[12px] text-cyan">
            PENSACOLA, FLORIDA · SOVEREIGN AI · CYBERSECURITY · HUMAN COMMAND
          </p>
          <p className="mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
            Principal Solutions Consultant and independent systems builder. Doug owns the compute, runs the routing
            policy, and remains accountable for every automated decision. The chair is empty on purpose: human authority
            stays visible.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {LAWS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`za-chip ${lawI === i ? "border-accent text-accent" : ""}`}
                onClick={() => {
                  setLawI(i);
                  getSound().ok();
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                LEASH {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <ol className="mt-8">
            {LAWS.map((law, i) => (
              <li key={law}>
                {i > 0 ? <div className="za-law-join" /> : null}
                <button
                  type="button"
                  className={`za-law-step w-full text-left ${i === lawI ? "on" : ""}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                  onClick={() => {
                    setLawI(i);
                    getSound().ok();
                  }}
                >
                  <span className="za-law-dot" />
                  <span className="za-display text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-ink">{law}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="za-stamp mt-8">SIGNED · OWNER · {VERIFIED_LONG}</div>
        </div>
      </div>
    </DeckShell>
  );
}

export function DeckEve({
  s7,
  lines,
  value,
  logHeight,
  onChange,
  onRun,
}: {
  s7: SecRef;
  lines: string[];
  value: string;
  logHeight: number;
  onChange: (v: string) => void;
  onRun: (raw: string) => void;
}) {
  const bitMood = useDeck((s) => s.bitMood);
  const cmds = useMemo(
    () => [
      "STATUS",
      "SITREP",
      "COST",
      "CURRENT",
      "FLEET",
      "LANES",
      "WITHHELD",
      "VERIFY",
      "WHOAMI",
      "TALK",
      "PHOTO",
      "CLEAR",
    ],
    [],
  );
  return (
    <DeckShell index={7} sRef={s7}>
      <div className="mx-auto max-w-3xl" style={{ "--eve-log-height": `${logHeight}px` } as CSSProperties}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Kicker>08 · E.V.E.</Kicker>
            <Title>EVALUATION VERIFICATION ENGINE</Title>
            <p className="mt-4 max-w-[52ch] text-muted">
              LOCAL · READ ONLY · NO NETWORK CALLS. It answers from the dated export on this page. Try{" "}
              <span className="text-cyan">sitrep</span>, <span className="text-cyan">current</span>, or{" "}
              <span className="text-cyan">help</span>.
            </p>
          </div>
          <BitMascot mood={bitMood} size={88} />
        </div>
        <EveConsole lines={lines} value={value} onChange={onChange} onRun={onRun} />
        <div className="mt-4 flex flex-wrap gap-2">
          {cmds.map((c) => (
            <button
              key={c}
              type="button"
              data-cmd={c.toLowerCase()}
              onClick={() => onRun(c.toLowerCase())}
              className="za-chip hover:border-cyan hover:text-cyan"
            >
              {c}
            </button>
          ))}
        </div>
        <p className="za-critical-telemetry za-mono mt-5 text-[10px] text-dim">
          EVERY ANSWER COMES FROM THE READ-ONLY {VERIFIED_LONG} DATED EXPORT — VALID THROUGH {EXPIRES_SHORT}. AFTER THAT
          THE CONSOLE REPORTS HISTORY, NOT STATUS. 18/19 AT 28 AUG PROBE · 2 PROXMOX HOSTS ONLINE · QUORATE · ROUTING
          INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES.
        </p>
      </div>
    </DeckShell>
  );
}

export function DeckContact({ s8, onCopy, copied }: { s8: SecRef; onCopy: () => void; copied: boolean }) {
  return (
    <DeckShell index={8} sRef={s8}>
      <div className="grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div data-hud-clear className="za-contact-copy">
          <Kicker>09 · CONTACT</Kicker>
          <Title>HAIL.</Title>
          <p className="mt-4 max-w-[46ch] text-[1.1rem] leading-relaxed text-muted">
            If you are building AI routing, automation reliability, explainability, cybersecurity exposure, or sovereign
            infrastructure — and need it to be both ambitious and provable — let us compare notes.
          </p>
          <div className="za-mission-stamp mt-7" role="note" aria-label="Mission complete">
            <span>MISSION COMPLETE · HUMAN COMMAND RETAINED</span>
            <strong>OWN THE SYSTEM. PROVE THE CLAIM. KEEP A HUMAN IN COMMAND.</strong>
          </div>
          <div className="za-panel za-hail mt-8 p-6">
            <div className="za-kicker">HAILING FREQUENCY</div>
            <div className="za-hail-scan" aria-hidden />
            <div className="za-mono mt-3 text-[10px] tracking-[0.22em] text-cyan">CHANNEL LOCK · OPEN</div>
            <a href="mailto:doug@cashio.us" className="za-display mt-3 block text-[clamp(1.4rem,3vw,2.2rem)] text-cyan">
              doug@cashio.us
            </a>
            <p className="za-contact-meta za-mono mt-3 text-dim">
              PENSACOLA, FLORIDA · PUBLIC-SAFE SNAPSHOT · VERIFIED {VERIFIED_LONG}
            </p>
          </div>
          <BlackBoxReceipt />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="mailto:doug@cashio.us" className="za-btn px-6 py-3 text-[12px]">
              EMAIL
            </a>
            <button type="button" className="za-btn-ghost min-h-11 px-5 py-3 text-[11px]" onClick={onCopy}>
              {copied ? "COPIED" : "COPY EMAIL"}
            </button>
            <a
              href="https://www.linkedin.com/in/dougcashio"
              target="_blank"
              rel="noreferrer"
              className="za-btn-ghost min-h-11 px-5 py-3 text-[11px]"
            >
              LINKEDIN
            </a>
            <a
              href="https://www.credly.com/users/james-cashio/badges/credly"
              target="_blank"
              rel="noreferrer"
              className="za-btn-ghost min-h-11 px-5 py-3 text-[11px]"
            >
              CREDLY
            </a>
          </div>
        </div>
        <Plate
          src="/plates/fold.jpg?v=48"
          alt="Heighliner folding space"
          className="h-[min(62vh,560px)] w-full"
          chip="HEIGHLINER · FOLD SPACE"
        />
      </div>
    </DeckShell>
  );
}
