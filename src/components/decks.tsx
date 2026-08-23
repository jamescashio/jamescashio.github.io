import { useCallback, useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import {
  ARTICLES,
  EXPIRES_SHORT,
  HOSTS,
  LANES,
  LAWS,
  LINEAGE,
  NAMED_ROLES,
  PILOT_CRAFT,
  PVE,
  POS,
  PROTEUS_EVIDENCE,
  ROUTING_STAGES,
  SERVICE_FAMILIES,
  TELEMETRY,
  VERIFIED_LONG,
  WITHHELD,
  DECK_CRAFT,
} from "@/lib/content";
import { getSound } from "@/lib/sound";
import { useDeck } from "@/lib/store";
import { BitMascot } from "./bit-mascot";
import { BuildEnvelope } from "./build-envelope";
import { EveConsole } from "./eve-console";

type SecRef = RefObject<HTMLElement | null>;

function Kicker({ children }: { children: string }) {
  return <div className="za-kicker mb-3">{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="za-display text-[clamp(2rem,5vw,4.4rem)] text-ink">{children}</h2>;
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const run = (t: number) => {
      const k = Math.min(1, (t - t0) / 920);
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

function DeckShell({
  index,
  sRef,
  children,
  className = "",
}: {
  index: number;
  sRef: SecRef;
  children: ReactNode;
  className?: string;
}) {
  const shown = useDeck((s) => s.shown.includes(index));
  return (
    <section
      ref={sRef}
      data-deck={index}
      className={`relative min-h-[92dvh] px-5 py-24 md:px-10 lg:px-14 ${className}`}
    >
      <div className={shown ? "za-rise" : "translate-y-6 opacity-0"}>{children}</div>
    </section>
  );
}

function Ticker() {
  const items = [...TELEMETRY, ...TELEMETRY];
  return (
    <div className="za-ticker mt-10 max-w-xl border-y border-line py-2">
      <div className="za-ticker-track za-mono text-[10px] tracking-[0.2em] text-cyan">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Plate({
  src,
  alt,
  className = "",
  fade = "bottom",
  chip,
}: {
  src: string;
  alt: string;
  className?: string;
  fade?: "bottom" | "right" | "left";
  chip?: ReactNode;
}) {
  return (
    <figure
      className={`za-plate ${className}`}
      onMouseEnter={() => getSound().tick()}
    >
      <img src={src} alt={alt} className="za-plate-img" decoding="async" />
      <span className={`za-plate-fade ${fade}`} aria-hidden />
      <span className="za-plate-scan" aria-hidden />
      <span className="za-plate-bezel" aria-hidden />
      <span className="za-plate-tick tl" aria-hidden />
      <span className="za-plate-tick br" aria-hidden />
      {chip ? <figcaption className="za-chip za-plate-chip">{chip}</figcaption> : null}
    </figure>
  );
}

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
    <section ref={s0} data-deck={0} className="relative min-h-[100dvh] px-5 pb-32 pt-24 md:px-10 lg:px-14">
      <div ref={copyCol} className="za-bracket max-w-[38rem] p-2">
        <Kicker>ZEUSAPOLLO · SOVEREIGN AI UNDER HUMAN COMMAND</Kicker>
        <h1 className="za-display text-[clamp(2rem,4.8vw,4.4rem)] leading-[0.92]">
          OWN THE IRON AND THE <span className="za-shimmer-text">ROUTE</span>.
        </h1>
        <p className="za-mono mt-5 text-[11px] text-dim">
          PUBLIC SNAPSHOT VERIFIED {VERIFIED_LONG} · 19/19 RUNNING · 2 HOSTS QUORATE · NOT A LIVE COUNTER
        </p>
        <p className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
          Two Proxmox hosts currently run nineteen containers. Ten public capability lanes sit in front of a private
          catalog of thirty-six models, so the right model does the work while a person stays in command of it. The
          current public snapshot was verified on {VERIFIED_LONG}.
        </p>

        <div className="mt-8 grid max-w-lg grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-line bg-void-2/70 p-1.5">
          <button
            type="button"
            onClick={() => {
              set({ mode: "technical", shown: [0] });
              getSound().prompt();
            }}
            className={`rounded-[10px] px-3 py-3 text-left ${mode === "technical" ? "bg-accent text-on-accent" : "text-dim"}`}
          >
            <div className="za-mono text-[10px] tracking-[0.2em]">TECHNICAL</div>
            <div className="mt-1 font-sans text-[13px] leading-snug">Nine decks. Fleet, routing law, hardware, builds.</div>
          </button>
          <button
            type="button"
            onClick={() => {
              set({ mode: "executive", shown: [0, 8] });
              getSound().prompt();
            }}
            className={`rounded-[10px] px-3 py-3 text-left ${mode === "executive" ? "bg-accent text-on-accent" : "text-dim"}`}
          >
            <div className="za-mono text-[10px] tracking-[0.2em]">EXECUTIVE</div>
            <div className="mt-1 font-sans text-[13px] leading-snug">One page. What it means for a business.</div>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" className="za-btn px-7 py-3.5 text-[13px]" onClick={onEngage}>
            {mode === "executive" ? "READ THE BRIEF" : "DESCEND THE DECKS"}
          </button>
          <button type="button" className="za-btn-ghost px-5 py-3 text-[11px]" onClick={onEve}>
            OPEN E.V.E. CONSOLE
          </button>
        </div>

        <div className="za-chip mt-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
          E.V.E. ONLINE · CURRENT · VERIFIED {VERIFIED_LONG} · VALID THRU {EXPIRES_SHORT}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["ZEUS", 13, "RUNNING WORKLOADS"],
            ["APOLLO", 6, "RUNNING WORKLOADS"],
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
          <Title>ONE OUTCOME. TWO OWNERSHIPS. HUMAN COMMAND.</Title>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">01 · OUTCOME</div>
              <div className="za-display mt-3 text-5xl text-cyan">
                <CountUp to={19} />/19
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Published container workloads running during the {VERIFIED_LONG} verification probe. Two Proxmox hosts
                online. Cluster quorate. Ten public lanes in front of thirty-six private catalog entries.
              </p>
            </article>
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">02 · OWNERSHIP</div>
              <ul className="mt-3 space-y-3 text-sm text-muted">
                <li>
                  <b className="text-ink">OWN THE IRON.</b> 19 containers on 2 Proxmox hosts I physically own.
                </li>
                <li>
                  <b className="text-ink">OWN THE ROUTE.</b> One gateway, ten lanes. Quality picks. Cost ties.
                </li>
                <li>
                  <b className="text-ink">OWN THE PROOF.</b> Every figure dated. Stale numbers withheld.
                </li>
              </ul>
            </article>
            <article className="za-panel p-5">
              <div className="za-mono text-[10px] text-accent">03 · COMMAND</div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Autonomy runs. A human is accountable for it. If you work on routing, reliability, explainability, or
                sovereign infrastructure — hail.
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
          Nineteen documented container roles. Zeus currently runs thirteen workloads; Apollo runs six. Seven families
          are named here. The other twelve stay public-safe — no addresses, no ports, no access paths, ever.
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
                <circle r="2.6" className="za-packet" style={{ offsetPath: `path('${pathZeus}')`, animationDelay: "1.1s" }} />
                <circle r="2.2" className="za-packet" style={{ offsetPath: `path('${pathZeus}')`, animationDelay: "2.2s" }} />
              </>
            ) : null}
            {pathApollo ? (
              <>
                <circle r="3.4" className="za-packet cool" style={{ offsetPath: `path('${pathApollo}')` }} />
                <circle r="2.4" className="za-packet cool" style={{ offsetPath: `path('${pathApollo}')`, animationDelay: "1.5s" }} />
              </>
            ) : null}
          </svg>
          <div className="flex flex-wrap gap-3">
            <div ref={hubZ} className={`za-panel za-hub warm px-5 py-4 ${locked?.hub === "zeus" ? "border-accent" : ""}`}>
              <div className="za-display text-xl text-accent">ZEUS</div>
              <div className="za-mono mt-1 text-[10px] text-dim">13 RUNNING WORKLOADS</div>
            </div>
            <div ref={hubA} className={`za-panel za-hub cool px-5 py-4 ${locked?.hub === "apollo" ? "border-cyan" : ""}`}>
              <div className="za-display text-xl text-cyan">APOLLO</div>
              <div className="za-mono mt-1 text-[10px] text-dim">6 RUNNING WORKLOADS</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
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
          <span className="za-chip">19 OF 19 VERIFIED RUNNING</span>
          <span className="za-chip">CLUSTER QUORATE</span>
          <span className="za-chip">EXPORT CURRENT</span>
          <span className="za-chip">0 STOPPED AT VERIFICATION</span>
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
          Quality picks the model. Cost only breaks a tie. Public capability lanes are not the same as private model
          entries. The public site exposes ten capability classes. The private Atlas catalog currently contains
          thirty-six model entries. The public number describes what the outside world can understand, not the complete
          internal provider inventory — and this page is policy, not a live provider status board.
        </p>

        <div className="mt-10 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
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
              TEN CONFIGURED PUBLIC CAPABILITY LANES — NOT A CLAIM THAT EVERY LANE IS ACTIVE ON EVERY REQUEST. THE
              PRIVATE ATLAS CATALOG HOLDS 36 MODEL ENTRIES. THE TWO FIGURES COUNT DIFFERENT OBJECTS AND ARE NEVER
              MERGED. DEEPSEEK TECHNICAL IDS: deepseek-v4-pro · deepseek-v4-flash.
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
            ZeusApollo currently runs Proxmox VE {PVE} across two online hosts with quorum maintained by its supporting
            edge node. Atlas is not a Proxmox host. If I cannot put a hand on it, it does not count as mine. Click a
            host. The plate holds the lock.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
              A figure with no fresh measurement is omitted entirely rather than published stale. Owner-run
              verification probe over cluster SSH by E.V.E. — a dated public-safe snapshot, not streaming telemetry.
              This page makes no production network calls.
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
          <article key={active.name} data-hud-clear className="za-panel za-lineage-dossier relative overflow-hidden p-7">
            <div className="za-kicker">FLIGHT RULE {String(pick + 1).padStart(2, "0")} / 04</div>
            <h3 className="za-display mt-4 text-[clamp(1.8rem,3.4vw,3rem)]">{active.name}</h3>
            <p className="mt-5 text-xl leading-snug text-ink">{active.rule}</p>
            <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-muted">{active.note}</p>
            {active.name === "RUTAN" ? (
              <section className="za-proteus-evidence mt-7" aria-label="Proteus flight-test evidence">
                <figure>
                  <div className="za-proteus-frame">
                    <img
                      src={PROTEUS_EVIDENCE.src}
                      alt={PROTEUS_EVIDENCE.alt}
                      className="za-proteus-photo"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="za-proteus-grid" aria-hidden />
                    <span className="za-proteus-acquire" aria-hidden />
                    <span className="za-chip za-proteus-label">{PROTEUS_EVIDENCE.label}</span>
                  </div>
                  <figcaption className="za-proteus-credit">
                    <span>{PROTEUS_EVIDENCE.credit} · OFFICIAL FLIGHT PHOTOGRAPH</span>
                    <a href={PROTEUS_EVIDENCE.sourceUrl} target="_blank" rel="noreferrer">
                      SOURCE ↗
                    </a>
                  </figcaption>
                </figure>
                <div className="za-proteus-facts" aria-label="Proteus specifications">
                  {PROTEUS_EVIDENCE.facts.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
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

export function DeckBuilds({ s5 }: { s5: SecRef }) {
  const sel = useDeck((s) => s.sel);
  const set = useDeck((s) => s.set);
  const article = ARTICLES[sel];
  const lock = useCallback((i: number) => {
    set({ sel: i });
    getSound().target((POS[i][0] / 100 - 0.5) * 1.4);
  }, [set]);
  return (
    <DeckShell index={5} sRef={s5}>
      <div className="max-w-6xl">
        <Kicker>06 · BUILDS</Kicker>
        <Title>SEVEN TEST ARTICLES.</Title>
        <p className="mt-5 max-w-[58ch] text-[1.05rem] leading-relaxed text-muted">
          Not mockups. Seven shipped builds on the same fabric. Select a marker or article to acquire its proof vector; arrow keys fly the range.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <BuildEnvelope sel={sel} onLock={lock} />
          <div data-hud-clear>
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
                <span>STATE · SHIPPED</span>
                <span>CONTROL · MANUAL</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col" role="group" aria-label="Select a test article">
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
                  <span className="za-build-index za-mono w-6 text-[10px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-display text-[12px] tracking-wide">{a.name}</span>
                  <span className="za-mono text-[9px] text-dim">{a.tag}</span>
                </button>
              ))}
            </div>
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
            Doug Cashio is a Principal Solutions Consultant and independent systems builder focused on sovereign AI,
            cybersecurity, automation reliability, and explainable infrastructure. Twenty-plus years in enterprise
            environments. The fleet, the routing law, the security posture and the publishing discipline are all
            owner-run — and all auditable. The chair is empty on purpose. Autonomy runs. A human is accountable for it.
            Never fake a number. Click a law. The leash is the point.
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
  onChange,
  onRun,
}: {
  s7: SecRef;
  lines: string[];
  value: string;
  onChange: (v: string) => void;
  onRun: (raw: string) => void;
}) {
  const bitMood = useDeck((s) => s.bitMood);
  const cmds = useMemo(
    () => ["STATUS", "SITREP", "COST", "CURRENT", "FLEET", "LANES", "WITHHELD", "VERIFY", "WHOAMI", "TALK", "PHOTO", "CLEAR"],
    [],
  );
  return (
    <DeckShell index={7} sRef={s7}>
      <div className="mx-auto max-w-3xl">
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
        <p className="za-mono mt-5 text-[10px] text-dim">
          EVERY ANSWER COMES FROM THE {VERIFIED_LONG} EXPORT — CURRENT THROUGH {EXPIRES_SHORT}. AFTER THAT THE CONSOLE
          REPORTS HISTORY, NOT STATUS. 19 OF 19 CONTAINERS RUNNING · 2 PROXMOX HOSTS ONLINE · CLUSTER QUORATE · 10
          PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES.
        </p>
      </div>
    </DeckShell>
  );
}

export function DeckContact({ s8, onCopy, copied }: { s8: SecRef; onCopy: () => void; copied: boolean }) {
  return (
    <DeckShell index={8} sRef={s8}>
      <div className="grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div data-hud-clear>
          <Kicker>09 · CONTACT</Kicker>
          <Title>HAIL.</Title>
          <p className="mt-4 max-w-[46ch] text-[1.1rem] leading-relaxed text-muted">
            If you work on AI routing, automation reliability, explainability, cybersecurity exposure, or sovereign
            infrastructure, I am glad to compare notes.
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
            <p className="za-mono mt-3 text-[11px] text-dim">
              PENSACOLA, FLORIDA · PUBLIC-SAFE SNAPSHOT · VERIFIED {VERIFIED_LONG}
            </p>
          </div>
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
