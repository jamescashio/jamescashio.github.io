import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import {
  ARTICLES,
  CRAFT,
  CRAFT_DECK,
  DECK_CRAFT,
  DECKS,
  RELEASE,
  REVISED,
  VERIFIED_LONG,
  EXPIRES_SHORT,
  daysLeft,
  resolveCraftIndex,
  stardate,
  validityShort,
} from "@/lib/content";
import { getSound } from "@/lib/sound";
import { shouldYieldAirframeHud } from "@/lib/hud-layout";
import { useDeck, type BitMood } from "@/lib/store";
import type { ViewscreenStageElement } from "@/lib/viewscreen";
import { BitMascot } from "./bit-mascot";
import {
  DeckBrief,
  DeckBuilds,
  DeckContact,
  DeckEve,
  DeckGrid,
  DeckIron,
  DeckLineage,
  DeckOperator,
  DeckRouting,
  DeckSnapshot,
} from "./decks";
import { INTRO, runEve } from "./eve-console";

export function CommandDeck() {
  const scRef = useRef<HTMLDivElement>(null);
  const copyCol = useRef<HTMLDivElement>(null);
  const sBrief = useRef<HTMLElement>(null);
  const s0 = useRef<HTMLElement>(null);
  const s1 = useRef<HTMLElement>(null);
  const s2 = useRef<HTMLElement>(null);
  const s3 = useRef<HTMLElement>(null);
  const s4 = useRef<HTMLElement>(null);
  const s5 = useRef<HTMLElement>(null);
  const s6 = useRef<HTMLElement>(null);
  const s7 = useRef<HTMLElement>(null);
  const s8 = useRef<HTMLElement>(null);
  const hubZ = useRef<HTMLDivElement>(null);
  const hubA = useRef<HTMLDivElement>(null);
  const stageRef = useRef<ViewscreenStageElement | null>(null);
  const sectionBag = useRef({ s0, s1, s2, s3, s4, s5, s6, s7, s8 });
  sectionBag.current = { s0, s1, s2, s3, s4, s5, s6, s7, s8 };
  const listSections = () => {
    const b = sectionBag.current;
    return [b.s0, b.s1, b.s2, b.s3, b.s4, b.s5, b.s6, b.s7, b.s8];
  };

  const deck = useDeck((s) => s.deck);
  const mode = useDeck((s) => s.mode);
  const audio = useDeck((s) => s.audio);
  const alert = useDeck((s) => s.alert);
  const photo = useDeck((s) => s.photo);
  const palette = useDeck((s) => s.palette);
  const tour = useDeck((s) => s.tour);
  const railOpen = useDeck((s) => s.railOpen);
  const prog = useDeck((s) => s.prog);
  const cine = useDeck((s) => s.cine);
  const chapOn = useDeck((s) => s.chapOn);
  const chap = useDeck((s) => s.chap);
  const chapText = useDeck((s) => s.chapText);
  const bitMood = useDeck((s) => s.bitMood);
  const copied = useDeck((s) => s.copied);
  const craftLock = useDeck((s) => s.craftLock);
  const set = useDeck((s) => s.set);

  const [consoleValue, setConsoleValue] = useState("");
  const [consoleLines, setConsoleLines] = useState<string[]>(INTRO);
  const [hist, setHist] = useState<string[]>([]);
  const [histI, setHistI] = useState(-1);
  const [clock, setClock] = useState("");
  const [stageOn, setStageOn] = useState(false);
  const [pathZeus, setPathZeus] = useState("");
  const [pathApollo, setPathApollo] = useState("");
  const [flash, setFlash] = useState(false);
  const [afFlash, setAfFlash] = useState(false);
  const [hudYield, setHudYield] = useState(false);
  const [rips, setRips] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sweep, setSweep] = useState(false);
  const jumpUntil = useRef(0);
  const tourI = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const lastDeck = useRef(0);
  const swipeX = useRef<number | null>(null);

  useEffect(() => {
    const on = (e: PointerEvent) => {
      const id = Date.now() + Math.random();
      setRips((r) => [...r.slice(-8), { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => setRips((r) => r.filter((x) => x.id !== id)), 620);
    };
    window.addEventListener("pointerdown", on);
    return () => window.removeEventListener("pointerdown", on);
  }, []);

  useEffect(() => {
    const scroller = scRef.current;
    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const targets = [...document.querySelectorAll<HTMLElement>("[data-hud-clear]")].map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        });
        setHudYield(
          shouldYieldAirframeHud(
            { width: window.innerWidth, height: window.innerHeight },
            targets,
          ),
        );
      });
    };

    measure();
    scroller?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (scroller) observer?.observe(scroller);
    return () => {
      window.cancelAnimationFrame(frame);
      scroller?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [mode]);

  useEffect(() => {
    void import("@/lib/viewscreen-stage.js").then((mod) => {
      const Ctor = (mod as { ViewscreenStage?: CustomElementConstructor }).ViewscreenStage;
      if (Ctor && typeof customElements !== "undefined" && !customElements.get("viewscreen-stage")) {
        customElements.define("viewscreen-stage", Ctor);
      }
      setStageOn(true);
    });
  }, []);

  useEffect(() => {
    setClock(stardate());
    const id = setInterval(() => setClock(stardate()), 1000);
    return () => clearInterval(id);
  }, []);

  const sfx = useCallback((kind: string, arg?: number) => {
    const s = getSound();
    if (!useDeck.getState().audio) return;
    const fn = (s as unknown as Record<string, (a?: number) => void>)[kind];
    if (typeof fn === "function") fn.call(s, arg);
  }, []);

  const bit = useCallback(
    (mood: BitMood) => {
      set({ bitMood: mood });
      window.setTimeout(() => {
        if (useDeck.getState().bitMood === mood) set({ bitMood: "idle" });
      }, 1600);
    },
    [set],
  );

  const cinePulse = useCallback(() => {
    set({ cine: true });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 680);
    window.setTimeout(() => set({ cine: false }), 1100);
  }, [set]);

  const chapter = useCallback(
    (i: number) => {
      const name = DECKS[i].name;
      const glyphs = "▓▚█≡Ξ01/\\";
      let k = 0;
      set({ chap: i, chapOn: true, chapText: "█" });
      const iv = window.setInterval(() => {
        k++;
        const n = Math.ceil(name.length * Math.min(1, k / 9));
        let out = name.slice(0, n);
        if (n < name.length) out += glyphs[(Math.random() * glyphs.length) | 0];
        else window.clearInterval(iv);
        set({ chapText: out });
      }, 52);
      window.setTimeout(() => set({ chapOn: false }), 1450);
    },
    [set],
  );

  const measureClear = useCallback(() => {
    const st = stageRef.current;
    if (!st?.setClearRect) return;
    if (useDeck.getState().gate) {
      st.setClearRect(0.32, 0.5);
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 768) {
      st.setClearRect(0.16, 0.52);
      return;
    }
    const i = useDeck.getState().deck;
    const active = listSections()[i]?.current;
    const col = (i === 0 ? copyCol.current : active) || copyCol.current;
    if (!col) return;
    const r = col.getBoundingClientRect();
    st.setClearRect((r.right + 32) / w, (r.bottom + 12) / h);
  }, []);

  const measureTopo = useCallback(() => {
    const sec = s1.current;
    const hz = hubZ.current;
    const ha = hubA.current;
    if (!sec || !hz || !ha) return;
    const base = sec.getBoundingClientRect();
    const centre = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - base.left + r.width / 2,
        y: r.top - base.top + r.height / 2,
        top: r.top - base.top,
      };
    };
    const from = { zeus: centre(hz), apollo: centre(ha) };
    const d = { zeus: "", apollo: "" };
    sec.querySelectorAll<HTMLElement>("[data-hub]").forEach((cell) => {
      const hub = cell.dataset.hub as "zeus" | "apollo" | undefined;
      if (!hub || !from[hub]) return;
      const h = from[hub];
      const c = centre(cell);
      const hy = h.y + 18;
      const mid = (hy + c.top) / 2;
      d[hub] += `M ${h.x.toFixed(1)} ${hy.toFixed(1)} C ${h.x.toFixed(1)} ${mid.toFixed(1)} ${c.x.toFixed(1)} ${mid.toFixed(1)} ${c.x.toFixed(1)} ${c.top.toFixed(1)} `;
    });
    setPathZeus(d.zeus);
    setPathApollo(d.apollo);
  }, []);

  const goto = useCallback(
    (i: number, auto = false) => {
      const el = listSections()[i]?.current;
      const sc = scRef.current;
      if (!el || !sc) return;
      const top = Math.max(0, el.offsetTop - 8);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) sc.scrollTop = top;
      else sc.scrollTo({ top, behavior: "smooth" });
      const st = stageRef.current;
      st?.warp?.();
      st?.setDeck?.(i);
      st?.setCraft?.(resolveCraftIndex(i, useDeck.getState().craftLock));
      cinePulse();
      chapter(i);
      setSweep(true);
      window.setTimeout(() => setSweep(false), 560);
      const shown = useDeck.getState().shown;
      jumpUntil.current = Date.now() + (auto ? 2400 : 1600);
      sfx("nav", i);
      lastDeck.current = i;
      set({
        deck: i,
        palette: false,
        shown: shown.includes(i) ? shown : [...shown, i],
      });
      bit("yes");
      window.setTimeout(() => {
        measureClear();
        measureTopo();
      }, 420);
    },
    [bit, chapter, cinePulse, measureClear, measureTopo, set, sfx],
  );

  useEffect(() => {
    if (craftLock == null) return;
    stageRef.current?.setCraft?.(craftLock);
  }, [craftLock]);

  useEffect(() => {
    setAfFlash(true);
    const t = window.setTimeout(() => setAfFlash(false), 720);
    return () => window.clearTimeout(t);
  }, [deck]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      document.documentElement.style.setProperty("--za-level", String(getSound().level()));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onScroll = useCallback(() => {
    const sc = scRef.current;
    if (!sc) return;
    if (useDeck.getState().tour && Date.now() > jumpUntil.current) {
      if (tourI.current) {
        clearInterval(tourI.current);
        tourI.current = 0;
      }
      set({ tour: false });
    }
    const secs = listSections();
    let i = 0;
    const reallyScrolled = sc.scrollTop >= 80;
    const canOverflow = sc.scrollHeight > sc.clientHeight + 120;
    if (reallyScrolled) {
      const y = sc.scrollTop + Math.min(240, sc.clientHeight * 0.24);
      secs.forEach((r, k) => {
        const el = r.current;
        if (el && el.offsetHeight > 160 && el.offsetTop <= y) i = k;
      });
      const atEnd = canOverflow && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8 && sc.scrollTop > sc.clientHeight * 0.45;
      if (atEnd) {
        for (let k = secs.length - 1; k >= 0; k--) {
          const el = secs[k].current;
          if (el && el.offsetHeight > 160) {
            i = k;
            break;
          }
        }
      }
    }
    const max = Math.max(1, sc.scrollHeight - sc.clientHeight);
    const p = Math.min(1, Math.max(0, sc.scrollTop / max));
    const st = stageRef.current;
    st?.setProgress?.(p);
    st?.setDeck?.(i);
    st?.setCraft?.(resolveCraftIndex(i, useDeck.getState().craftLock));
    const snd = getSound();
    if (useDeck.getState().audio) {
      snd.setDepth(p);
      const now = performance.now();
      const dy = Math.abs(sc.scrollTop - (lastY.current || sc.scrollTop));
      const dtms = Math.max(16, now - (lastT.current || now));
      lastY.current = sc.scrollTop;
      lastT.current = now;
      vel.current = vel.current * 0.72 + Math.min(1, dy / dtms / 2.6) * 0.28;
      snd.setVelocity(vel.current);
    }
    const shown = useDeck.getState().shown.slice();
    const bottom = sc.scrollTop + sc.clientHeight * 0.86;
    secs.forEach((r, k) => {
      const el = r.current;
      if (!el || shown.includes(k)) return;
      if (el.offsetTop < bottom && el.offsetTop + el.offsetHeight > sc.scrollTop) shown.push(k);
    });
    const next: Partial<{ deck: number; prog: number; shown: number[]; craftLock: number | null }> = {};
    if (i !== useDeck.getState().deck) {
      next.deck = i;
      if (i !== 4) next.craftLock = null;
      if (Date.now() > jumpUntil.current) chapter(i);
    }
    const pct = Math.round(p * 100);
    if (pct !== useDeck.getState().prog) next.prog = pct;
    if (shown.length !== useDeck.getState().shown.length) next.shown = shown;
    if (Object.keys(next).length) set(next);
    measureClear();
  }, [chapter, measureClear, set]);

  useEffect(() => {
    const sc = scRef.current;
    if (!sc) return;
    sc.addEventListener("scroll", onScroll, { passive: true });
    const spy = window.setInterval(onScroll, 240);
    const onResize = () => {
      measureClear();
      measureTopo();
    };
    window.addEventListener("resize", onResize);
    const later = window.setTimeout(onResize, 500);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearInterval(spy);
      clearTimeout(later);
    };
  }, [measureClear, measureTopo, onScroll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      const typing = e.target && /input|textarea/i.test((e.target as HTMLElement).tagName || "");
      if (useDeck.getState().photo) {
        set({ photo: false });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        set({ palette: !useDeck.getState().palette });
        sfx("prompt");
        return;
      }
      if (k === "escape") {
        set({ palette: false });
        return;
      }
      if (typing) {
        if (k === "arrowup" || k === "arrowdown") {
          e.preventDefault();
          const h = hist;
          if (!h.length) return;
          if (k === "arrowup") {
            const ni = histI < 0 ? h.length - 1 : Math.max(0, histI - 1);
            setHistI(ni);
            setConsoleValue(h[ni]);
          } else {
            if (histI < 0) return;
            const ni = histI + 1;
            if (ni >= h.length) {
              setHistI(-1);
              setConsoleValue("");
            } else {
              setHistI(ni);
              setConsoleValue(h[ni]);
            }
          }
        }
        return;
      }
      const n = ARTICLES.length;
      if (k === "arrowright") {
        const sel = (useDeck.getState().sel + 1) % n;
        set({ sel });
        sfx("target", sel);
      }
      if (k === "arrowleft") {
        const sel = (useDeck.getState().sel + n - 1) % n;
        set({ sel });
        sfx("target", sel);
      }
      if (k === "r") {
        set({ alert: true });
        sfx("klaxon");
        bit("alert");
        window.setTimeout(() => set({ alert: false }), 1900);
      }
      if (k === "a") {
        const next = !useDeck.getState().audio;
        const s = getSound();
        if (next) {
          const armed = s.arm();
          if (armed) s.prompt();
          set({ audio: armed });
        } else {
          s.disarm();
          set({ audio: false });
        }
      }
      if (k >= "1" && k <= "9") goto(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bit, goto, hist, histI, set, sfx]);

  const run = (raw: string) => {
    const cmd = (raw || "").trim();
    if (!cmd) return;
    if (cmd.toLowerCase() === "clear") {
      setConsoleLines(INTRO.slice());
      setConsoleValue("");
      return;
    }
    const res = runEve(cmd, hist);
    setConsoleLines((l) => l.concat("$ " + cmd.toUpperCase(), ...res.out));
    setConsoleValue("");
    setHist((h) => h.concat(cmd));
    setHistI(-1);
    if (res.bad) {
      sfx("err");
      bit("no");
    } else {
      sfx("ok");
      bit("yes");
    }
    if (res.go != null) window.setTimeout(() => goto(res.go!), 650);
    if (res.photo) window.setTimeout(() => set({ photo: true }), 400);
    if (res.alert) {
      set({ alert: true });
      sfx("klaxon");
      window.setTimeout(() => set({ alert: false }), 1900);
    }
  };

  const toggleAudio = () => {
    const s = getSound();
    const next = !useDeck.getState().audio;
    if (next) {
      const armed = s.arm();
      if (armed) s.prompt();
      set({ audio: armed });
    } else {
      s.disarm();
      set({ audio: false });
    }
  };

  const toggleTour = () => {
    if (tour) {
      if (tourI.current) clearInterval(tourI.current);
      tourI.current = 0;
      set({ tour: false });
      return;
    }
    set({ tour: true });
    goto((deck + 1) % 9, true);
    tourI.current = window.setInterval(() => {
      const cur = useDeck.getState().deck;
      goto((cur + 1) % 9, true);
    }, 9500);
  };

  const copyMail = async () => {
    try {
      await navigator.clipboard.writeText("doug@cashio.us");
    } catch {
      /* ignore */
    }
    set({ copied: true });
    sfx("ok");
    sfx("hail");
    window.setTimeout(() => set({ copied: false }), 2200);
  };

  const hud = photo ? "pointer-events-none invisible opacity-0" : "";
  const craftI = resolveCraftIndex(deck, craftLock);
  const craft = CRAFT[craftI];
  const dleft = daysLeft();

  return (
    <div className="relative h-dvh overflow-hidden bg-void text-ink">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[200] bg-void text-cyan focus:not-sr-only focus:rounded-lg focus:border focus:border-cyan focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:outline-none"
      >
        Skip to content
      </a>
      {stageOn ? (
        <viewscreen-stage ref={stageRef as unknown as Ref<HTMLElement>} />
      ) : (
        <div className="fixed inset-0 z-0 bg-void" />
      )}
      <div className="za-vignette" />
      <div className="za-spot" aria-hidden />
      <div className="za-scan" />
      <div className={`za-warpflash ${flash ? "on" : ""}`} />
      <div className={`za-sweep ${sweep ? "on" : ""}`} aria-hidden />

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col bg-void/90 backdrop-blur-md transition-[width] duration-300 md:flex ${hud} ${
          railOpen ? "w-[220px]" : "w-[68px]"
        }`}
      >
          <button
            type="button"
            className="za-lcars-cap warm mx-0 mt-0 h-16 px-3 text-left text-[13px]"
            onClick={() => goto(0)}
          >
            {railOpen ? "ZEUSAPOLLO" : "ZA"}
          </button>
          <nav aria-label="Command decks" className="mt-2 flex flex-1 flex-col gap-1 px-2">
            {DECKS.map((d, i) => {
              if (mode === "executive" && i !== 0 && i !== 8) return null;
              const on = deck === i;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => goto(i)}
                  onMouseEnter={() => sfx("tick")}
                  className={`flex min-h-11 items-center gap-3 rounded-r-[22px] px-3 py-2 text-left transition-colors ${
                    on ? "bg-accent text-on-accent" : "bg-white/5 text-dim hover:bg-cyan/15 hover:text-ink"
                  }`}
                >
                  <span className="za-mono w-5 text-[10px]">{d.num}</span>
                  {railOpen && <span className="za-mono text-[10px] tracking-[0.16em]">{d.name}</span>}
                </button>
              );
            })}
          </nav>
          <div className="flex flex-col gap-1 p-2">
            <button type="button" className="za-btn-ghost rounded-r-[22px] px-2 py-2 text-[10px]" onClick={toggleTour}>
              {tour ? "◼" : "▸▸"} {railOpen && (tour ? "TOUR" : "AUTOPILOT")}
            </button>
            <button type="button" className="za-btn-ghost rounded-r-[22px] px-2 py-2 text-[10px]" onClick={toggleAudio}>
              {audio ? "◉" : "○"} {railOpen && (audio ? "AUDIO" : "ARM AUDIO")}
            </button>
            <button
              type="button"
              className="za-lcars-cap cool min-h-11 px-3 text-[11px]"
              onClick={() => set({ railOpen: !railOpen })}
            >
              {railOpen ? "STOW" : "▸"}
            </button>
          </div>
        </aside>

      <header
        className={`za-command-header pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 md:left-[68px] ${hud}`}
      >
          <div className="pointer-events-auto za-chip">
            DECK {String(deck + 1).padStart(2, "0")} · {DECKS[deck].name}
          </div>
          <div className="pointer-events-auto hidden items-center gap-1.5 sm:flex">
            {CRAFT.map((c, i) => (
              <button
                key={c[0]}
                type="button"
                aria-label={`Warp to ${c[0]}`}
                title={c[0]}
                onClick={() => {
                  goto(CRAFT_DECK[i]);
                  getSound().craft(i, "pip");
                }}
                className={`za-lcars-pip ${i === craftI ? "on" : i < craftI ? "past" : ""}`}
                style={{ width: i === craftI ? 26 : 14 }}
              />
            ))}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="za-chip !hidden sm:!inline-flex">19/19 NOMINAL</span>
            {tour ? <span className="za-chip text-accent">AUTOPILOT</span> : null}
            <span className="za-chip !hidden md:!inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
              {validityShort()}
            </span>
            <span className="za-chip !hidden lg:!inline-flex">SD {clock}</span>
            <button
              type="button"
              className={`za-chip pointer-events-auto ${audio ? "border-cyan text-cyan" : ""}`}
              onClick={toggleAudio}
              aria-pressed={audio}
              title={audio ? "Mute selection audio" : "Arm selection audio"}
            >
              {audio ? (
                <span className="za-eq !hidden sm:!flex" aria-hidden>
                  <span /><span /><span /><span /><span />
                </span>
              ) : null}
              {audio ? "AUDIO ARMED" : "AUDIO OFF"}
            </button>
            <button
              type="button"
              className="za-chip pointer-events-auto hover:border-cyan hover:text-cyan"
              onClick={() => {
                set({ palette: true });
                sfx("prompt");
              }}
            >
              ⌘K
            </button>
          </div>
        </header>

      <main
        id="main-content"
        tabIndex={-1}
        ref={scRef}
        className="za-scroll relative z-10 h-dvh overflow-x-hidden overflow-y-auto md:pl-[68px]"
        style={{ visibility: photo ? "hidden" : "visible" }}
        onTouchStart={(e) => {
          swipeX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (swipeX.current == null) return;
          const dx = e.changedTouches[0].clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) < 72) return;
          if (dx < 0) goto(Math.min(8, deck + 1));
          else goto(Math.max(0, deck - 1));
        }}
      >
        <DeckSnapshot
          s0={s0}
          copyCol={copyCol}
          onEngage={() =>
            mode === "executive"
              ? sBrief.current && scRef.current?.scrollTo({ top: sBrief.current.offsetTop, behavior: "smooth" })
              : goto(1)
          }
          onEve={() => goto(7)}
        />
        {mode === "executive" && <DeckBrief sBrief={sBrief} />}
        {mode === "technical" && (
          <>
            <DeckGrid s1={s1} hubZ={hubZ} hubA={hubA} pathZeus={pathZeus} pathApollo={pathApollo} />
            <DeckRouting s2={s2} />
            <DeckIron s3={s3} />
            <DeckLineage s4={s4} />
            <DeckBuilds s5={s5} />
            <DeckOperator s6={s6} />
            <DeckEve s7={s7} lines={consoleLines} value={consoleValue} onChange={setConsoleValue} onRun={run} />
          </>
        )}
        <DeckContact s8={s8} onCopy={copyMail} copied={copied} />
        <footer data-hud-clear className="px-6 pb-20 pt-6 md:px-14">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 za-mono text-[10px] text-dim">
            <span>{RELEASE}</span>
            <span>REVISED {REVISED}</span>
            <span className="inline-flex items-center gap-2 text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
              {dleft > 0 ? "CURRENT" : "EXPIRED"}
            </span>
            <span>FIGURES VERIFIED {VERIFIED_LONG}</span>
            <span>VALID THRU {dleft > 0 ? EXPIRES_SHORT : "— TREAT AS HISTORY"}</span>
            <span>ZERO INFRASTRUCTURE CALLS</span>
          </div>
        </footer>
      </main>

      <div
        className={`pointer-events-none fixed bottom-[118px] left-[calc(68px+5vw)] z-40 transition duration-500 ${
          chapOn ? "opacity-100" : "translate-y-4 opacity-0"
        } ${hud}`}
      >
        <div className="za-kicker">DECK {String(chap + 1).padStart(2, "0")} / 09</div>
        <div className="za-display mt-2 text-[clamp(2rem,4.4vw,3.6rem)] drop-shadow-[0_0_28px_rgba(0,249,255,0.25)]">
          {chapText}
        </div>
        <div className="za-mono mt-2 max-w-[52ch] text-[11px] text-dim">{DECKS[chap].tag}</div>
      </div>

      <div className={`za-corner-hud fixed bottom-5 right-4 z-40 items-end gap-3 ${deck === 7 ? "hidden" : "flex"} ${hudYield ? "yield" : ""} ${hud}`}>
        <div
          className={`za-airframe hidden max-w-[250px] cursor-pointer rounded-[var(--radius-md)] border border-line bg-void/80 p-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-dim hover:border-cyan md:block ${afFlash ? "flash" : ""}`}
          onClick={() => goto(CRAFT_DECK[craftI])}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") goto(CRAFT_DECK[craftI]);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open ${craft[0]} airframe deck`}
        >
          <div className="flex items-center gap-2">
            <b className="text-cyan">AIRFRAME {String(craftI + 1).padStart(2, "0")} / {String(CRAFT.length).padStart(2, "0")}</b>
            <span className="za-airframe-compact-name text-ink">{craft[0]}</span>
            {audio && (
              <span className="za-eq ml-auto" aria-hidden>
                <span /><span /><span /><span /><span />
              </span>
            )}
          </div>
          <div className="za-airframe-details">
            <div className="mt-1 text-ink">{craft[0]}</div>
            <div className="text-accent">{craft[1]}</div>
            <div className="mt-1">{craft[2]}</div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${prog}%` }} />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="za-bit-control rounded-full focus-visible:outline-none"
          onClick={() => {
            sfx("bitYes");
            bit("yes");
            goto(7);
          }}
          title="Talk to E.V.E."
          aria-label="Open E.V.E. console"
        >
          <BitMascot mood={bitMood} size={hudYield ? 72 : 104} />
        </button>
      </div>

      <nav
        aria-label="Mobile command decks"
        className={`fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-line bg-void/90 py-2 backdrop-blur md:hidden ${hud}`}
      >
        {DECKS.filter((_, i) => (mode === "executive" ? i === 0 || i === 8 : true))
          .slice(0, 6)
          .map((d) => {
            const i = DECKS.findIndex((x) => x.id === d.id);
            return (
              <button
                key={d.id}
                type="button"
                aria-label={`Go to ${d.name}`}
                onClick={() => goto(i)}
                className={`za-mono min-h-11 px-2 py-2 text-[10px] ${deck === i ? "text-accent" : "text-dim"}`}
              >
                {d.num}
              </button>
            );
          })}
        <button
          type="button"
          aria-label="Open deck navigator"
          className="za-mono min-h-11 px-2 py-2 text-[10px] text-cyan"
          onClick={() => set({ palette: true })}
        >
          GO
        </button>
      </nav>

      <div
        aria-hidden
        className={`pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[9vh] border-b border-line bg-[#04050a] transition-transform duration-700 ${
          cine ? "translate-y-0" : "-translate-y-full"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-0 left-0 right-0 z-[60] h-[9vh] border-t border-line bg-[#04050a] transition-transform duration-700 ${
          cine ? "translate-y-0" : "translate-y-full"
        }`}
      />

      {alert && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] animate-[za-redpulse_1.1s_ease_infinite] border-[3px] border-red shadow-[inset_0_0_150px_rgba(255,0,51,0.45)]"
          />
          <div className="za-display fixed left-1/2 top-16 z-[71] -translate-x-1/2 rounded-[var(--radius-sm)] border border-red bg-[#120006]/90 px-5 py-2 text-[12px] tracking-[0.28em] text-red">
            RED ALERT · DRILL ONLY
          </div>
        </>
      )}

      {palette && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-void/80 pt-[12vh] backdrop-blur-md"
          onClick={(e) => {
            const t = (e.target as HTMLElement).closest("[data-d]");
            if (t) goto(Number((t as HTMLElement).dataset.d));
            else set({ palette: false });
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Deck navigator"
            className="w-[min(580px,90vw)] overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-panel)]"
          >
            <div className="flex items-center gap-2 border-b border-line px-5 py-3 za-mono text-[11px] tracking-[0.16em] text-cyan">
              <span className="text-accent">▸</span> GO TO DECK
              <span className="ml-auto text-dim">ESC TO CLOSE</span>
            </div>
            <div className="grid p-2">
              {DECKS.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  data-d={i}
                  className={`flex w-full gap-4 rounded-[var(--radius-sm)] px-3 py-2.5 text-left ${
                    i === deck ? "bg-accent/15 text-ink" : "hover:bg-white/5"
                  }`}
                >
                  <span className="za-mono text-accent">{d.num}</span>
                  <span className="font-display tracking-wide">{d.name}</span>
                  <span className="ml-auto hidden za-mono text-[10px] text-dim sm:inline">{d.tag}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 border-t border-line px-5 py-2 za-mono text-[9px] tracking-[0.14em] text-dim">
              <span>1–9 JUMP</span>
              <span className="text-green">CURRENT</span>
              <span className="text-red">R RED ALERT</span>
              <span>A AUDIO</span>
              <span>T AUTOPILOT</span>
              <span>⌘K PALETTE</span>
            </div>
          </div>
        </div>
      )}

      {rips.map((r) => (
        <span key={r.id} className="za-rip" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
    </div>
  );
}
