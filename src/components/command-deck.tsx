import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import {
  ARTICLES,
  CRAFT,
  DECKS,
  RELEASE,
  REVISED,
  VERIFIED_LONG,
  EXPIRES_SHORT,
  craftLockAfterDeckChange,
  craftRoute,
  daysLeft,
  resolveCraftIndex,
  stardate,
} from "@/lib/content";
import { getSound } from "@/lib/sound";
import { focusDeckHeading, isInteractiveShortcutTarget } from "@/lib/deck-focus";
import { shouldYieldAirframeHud } from "@/lib/hud-layout";
import { scheduleStageLoad } from "@/lib/stage-load-scheduler";
import {
  beginHashRestore,
  cancelHashRestore,
  classifyHashChange,
  consumeScrollDeck,
  createHashTransitionState,
  formatDeckHash,
  hashWriteModeForNavigation,
  parseDeckHash,
  shouldStopFlightForNavigation,
  type NavigationOrigin,
} from "@/lib/deck-navigation";
import {
  flightActionAt,
  isFlightStopKey,
  nextFlightHandoffAt,
  prepareFlightStart,
  type FlightState,
} from "@/lib/flight-plan";
import { useDeck, type BitMood } from "@/lib/store";
import type { ViewscreenStageElement } from "@/lib/viewscreen";
import { BitMascot } from "./bit-mascot";
import { CommandHeader, DesktopCommandRail, MobileCommandNavigation, MobileFlightControl } from "./command-chrome";
import { DeckNavigator } from "./deck-navigator";
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
  const paletteOpener = useRef<HTMLElement | null>(null);
  const pendingDestinationFocus = useRef<number | null>(null);
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
  const [flightElapsed, setFlightElapsed] = useState(0);
  const jumpUntil = useRef(0);
  const flightTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const flightRun = useRef<FlightState | null>(null);
  const hashTransition = useRef(createHashTransitionState());
  const hashSuppressionTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const resizeAnchorTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const resizeAnchorFrame = useRef(0);
  const pendingNavigation = useRef<{
    deck: number;
    source: NavigationOrigin;
    craftOverride?: number | null;
    articleOverride?: number;
  } | null>(null);
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
        setHudYield(shouldYieldAirframeHud({ width: window.innerWidth, height: window.innerHeight }, targets));
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
    return scheduleStageLoad({
      load: () => import("@/lib/viewscreen-stage.js"),
      onReady: (mod) => {
        const Ctor = (mod as { ViewscreenStage?: CustomElementConstructor }).ViewscreenStage;
        if (Ctor && typeof customElements !== "undefined" && !customElements.get("viewscreen-stage")) {
          customElements.define("viewscreen-stage", Ctor);
        }
        setStageOn(true);
      },
      onFallback: () => setStageOn(false),
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
      d[hub] +=
        `M ${h.x.toFixed(1)} ${hy.toFixed(1)} C ${h.x.toFixed(1)} ${mid.toFixed(1)} ${c.x.toFixed(1)} ${mid.toFixed(1)} ${c.x.toFixed(1)} ${c.top.toFixed(1)} `;
    });
    setPathZeus(d.zeus);
    setPathApollo(d.apollo);
  }, []);

  const syncHash = useCallback((nextDeck: number, nextArticle: number, historyMode: "push" | "replace") => {
    const hash = formatDeckHash({ deck: nextDeck, article: nextArticle });
    if (window.location.hash === hash) return;
    window.history[historyMode === "push" ? "pushState" : "replaceState"](window.history.state, "", hash);
  }, []);

  const clearHashSuppressionTimer = useCallback(() => {
    if (hashSuppressionTimer.current != null) window.clearTimeout(hashSuppressionTimer.current);
    hashSuppressionTimer.current = null;
  }, []);

  const clearResizeAnchor = useCallback(() => {
    if (resizeAnchorTimer.current != null) window.clearTimeout(resizeAnchorTimer.current);
    if (resizeAnchorFrame.current) window.cancelAnimationFrame(resizeAnchorFrame.current);
    resizeAnchorTimer.current = null;
    resizeAnchorFrame.current = 0;
  }, []);

  const cancelProgrammaticScroll = useCallback(() => {
    clearHashSuppressionTimer();
    clearResizeAnchor();
    hashTransition.current = cancelHashRestore(hashTransition.current);
    pendingDestinationFocus.current = null;
  }, [clearHashSuppressionTimer, clearResizeAnchor]);

  const beginProgrammaticScroll = useCallback(
    (targetDeck: number) => {
      clearHashSuppressionTimer();
      hashTransition.current = beginHashRestore(hashTransition.current, targetDeck);
      hashSuppressionTimer.current = window.setTimeout(() => {
        hashTransition.current = cancelHashRestore(hashTransition.current);
        hashSuppressionTimer.current = null;
      }, 3200);
    },
    [clearHashSuppressionTimer],
  );

  const stopFlight = useCallback(() => {
    if (flightTimer.current != null) window.clearTimeout(flightTimer.current);
    flightTimer.current = null;
    flightRun.current = null;
    setFlightElapsed(0);
    cancelProgrammaticScroll();
    if (useDeck.getState().tour) set({ tour: false });
  }, [cancelProgrammaticScroll, set]);

  const toggleTour = useCallback(() => {
    if (useDeck.getState().tour) {
      stopFlight();
      return;
    }
    const start = prepareFlightStart(Date.now());
    flightRun.current = start.flight;
    setFlightElapsed(0);
    set({ mode: start.mode, tour: true });
  }, [set, stopFlight]);

  const openPalette = useCallback(
    (opener: HTMLElement | null) => {
      paletteOpener.current = opener;
      set({ palette: true });
    },
    [set],
  );

  const closePalette = useCallback(() => {
    set({ palette: false });
    const opener = paletteOpener.current;
    paletteOpener.current = null;
    opener?.focus();
  }, [set]);

  const goto = useCallback(
    (i: number, source: NavigationOrigin = "manual", craftOverride?: number | null, articleOverride?: number) => {
      if (shouldStopFlightForNavigation(source)) stopFlight();
      const technicalTarget = i > 0 && i < DECKS.length - 1;
      if (technicalTarget && useDeck.getState().mode === "executive") {
        if (useDeck.getState().deck !== i) beginProgrammaticScroll(i);
        pendingNavigation.current = { deck: i, source, craftOverride, articleOverride };
        set({ mode: "technical", palette: false });
        return;
      }
      const el = listSections()[i]?.current;
      const sc = scRef.current;
      if (!el || !sc) return;
      if (useDeck.getState().deck !== i) beginProgrammaticScroll(i);
      const top = Math.max(0, el.offsetTop - 8);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) sc.scrollTop = top;
      else sc.scrollTo({ top, behavior: "smooth" });
      const st = stageRef.current;
      st?.warp?.();
      st?.setDeck?.(i);
      const activeCraftLock = craftOverride === undefined ? useDeck.getState().craftLock : craftOverride;
      st?.setCraft?.(resolveCraftIndex(i, activeCraftLock));
      cinePulse();
      chapter(i);
      setSweep(true);
      window.setTimeout(() => setSweep(false), 560);
      const shown = useDeck.getState().shown;
      const selectedArticle =
        articleOverride == null
          ? useDeck.getState().sel
          : Math.max(0, Math.min(ARTICLES.length - 1, Math.trunc(articleOverride)));
      jumpUntil.current = Date.now() + (source === "flight" ? 2400 : 1600);
      sfx("nav", i);
      lastDeck.current = i;
      set({
        deck: i,
        sel: selectedArticle,
        palette: false,
        shown: shown.includes(i) ? shown : [...shown, i],
        ...(craftOverride === undefined ? {} : { craftLock: craftOverride }),
      });
      const historyMode = hashWriteModeForNavigation(source);
      if (historyMode) syncHash(i, selectedArticle, historyMode);
      bit("yes");
      window.setTimeout(() => {
        measureClear();
        measureTopo();
      }, 420);
    },
    [beginProgrammaticScroll, bit, chapter, cinePulse, measureClear, measureTopo, set, sfx, stopFlight, syncHash],
  );

  useEffect(() => {
    if (mode !== "technical" || pendingNavigation.current == null) return;
    const pending = pendingNavigation.current;
    pendingNavigation.current = null;
    const destinationFocus = pendingDestinationFocus.current === pending.deck ? pending.deck : null;
    goto(pending.deck, pending.source, pending.craftOverride, pending.articleOverride);
    if (destinationFocus != null) pendingDestinationFocus.current = destinationFocus;
  }, [goto, mode]);

  const focusPendingDestination = useCallback((landedDeck: number) => {
    const target = pendingDestinationFocus.current;
    if (target == null || target !== landedDeck || hashTransition.current.restoringDeck != null) return;
    if (focusDeckHeading(document, target)) pendingDestinationFocus.current = null;
  }, []);

  useEffect(() => {
    const target = pendingDestinationFocus.current;
    if (palette || target == null || deck !== target || hashTransition.current.restoringDeck != null) return;
    const frame = window.requestAnimationFrame(() => focusPendingDestination(target));
    return () => window.cancelAnimationFrame(frame);
  }, [deck, focusPendingDestination, mode, palette]);

  const gotoCraft = useCallback(
    (craftIndex: number) => {
      const route = craftRoute(craftIndex);
      goto(route.deck, "manual", route.craftLock);
    },
    [goto],
  );

  const selectArticle = useCallback(
    (article: number) => {
      stopFlight();
      const selected = Math.max(0, Math.min(ARTICLES.length - 1, Math.trunc(article)));
      set({ sel: selected });
      if (useDeck.getState().deck === 5) syncHash(5, selected, "push");
      sfx("target", selected);
    },
    [set, sfx, stopFlight, syncHash],
  );

  const runFlight = useCallback(
    (state: FlightState) => {
      const tick = () => {
        if (flightRun.current !== state || !useDeck.getState().tour || state.startedAt == null) return;
        const elapsed = Date.now() - state.startedAt;
        setFlightElapsed(elapsed);
        const action = flightActionAt(elapsed);
        if (action.kind === "complete") {
          goto(action.deck, "flight");
          flightTimer.current = null;
          flightRun.current = null;
          setFlightElapsed(30_000);
          set({ tour: false });
          return;
        }

        const article = "article" in action && typeof action.article === "number" ? action.article : undefined;
        goto(action.deck, "flight", undefined, article);
        const nextAt = nextFlightHandoffAt(elapsed);
        if (nextAt == null) return;
        flightTimer.current = window.setTimeout(tick, Math.max(0, nextAt - (Date.now() - state.startedAt)));
      };
      tick();
    },
    [goto, set],
  );

  useEffect(() => {
    const restoreHash = () => {
      const target = parseDeckHash(window.location.hash);
      goto(target.deck, "hash", undefined, target.article);
    };
    if (window.location.hash) restoreHash();
    else syncHash(useDeck.getState().deck, useDeck.getState().sel, "replace");
    const onHashChange = () => {
      const transition = classifyHashChange(hashTransition.current, window.location.hash);
      hashTransition.current = transition.state;
      if (transition.kind === "internal") return;
      stopFlight();
      restoreHash();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [goto, stopFlight, syncHash]);

  useEffect(() => {
    return () => {
      if (flightTimer.current != null) window.clearTimeout(flightTimer.current);
      clearHashSuppressionTimer();
      clearResizeAnchor();
    };
  }, [clearHashSuppressionTimer, clearResizeAnchor]);

  useEffect(() => {
    const state = flightRun.current;
    if (tour && mode === "technical" && state && flightTimer.current == null) runFlight(state);
  }, [mode, runFlight, tour]);

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
    if (!audio) {
      document.documentElement.style.setProperty("--za-level", "0");
      return;
    }
    let raf = 0;
    const tick = () => {
      document.documentElement.style.setProperty("--za-level", String(getSound().level()));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audio]);

  const onScroll = useCallback(() => {
    const sc = scRef.current;
    if (!sc) return;
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
      const atEnd =
        canOverflow && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8 && sc.scrollTop > sc.clientHeight * 0.45;
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
    const scrollTransition = consumeScrollDeck(hashTransition.current, i);
    hashTransition.current = scrollTransition.state;
    if (hashTransition.current.restoringDeck == null) clearHashSuppressionTimer();
    const next: Partial<{ deck: number; prog: number; shown: number[]; craftLock: number | null }> = {};
    if (scrollTransition.updateDeck && i !== useDeck.getState().deck) {
      next.deck = i;
      next.craftLock = craftLockAfterDeckChange(useDeck.getState().craftLock, i, Date.now() <= jumpUntil.current);
      if (Date.now() > jumpUntil.current) chapter(i);
    }
    const pct = Math.round(p * 100);
    if (pct !== useDeck.getState().prog) next.prog = pct;
    if (shown.length !== useDeck.getState().shown.length) next.shown = shown;
    if (Object.keys(next).length) {
      set(next);
      if (next.deck != null) {
        if (scrollTransition.writeHash) syncHash(next.deck, useDeck.getState().sel, "replace");
      }
    }
    focusPendingDestination(i);
    measureClear();
  }, [chapter, clearHashSuppressionTimer, focusPendingDestination, measureClear, set, syncHash]);

  useEffect(() => {
    const sc = scRef.current;
    if (!sc) return;
    sc.addEventListener("scroll", onScroll, { passive: true });
    const spy = window.setInterval(onScroll, 240);
    const measureLayout = () => {
      measureClear();
      measureTopo();
    };
    const onResize = () => {
      measureLayout();
      const targetDeck = useDeck.getState().deck;
      beginProgrammaticScroll(targetDeck);
      clearResizeAnchor();
      resizeAnchorTimer.current = window.setTimeout(() => {
        resizeAnchorTimer.current = null;
        resizeAnchorFrame.current = window.requestAnimationFrame(() => {
          resizeAnchorFrame.current = 0;
          if (hashTransition.current.restoringDeck !== targetDeck) return;
          const target = listSections()[targetDeck]?.current;
          if (!target || !scRef.current) return;
          scRef.current.scrollTo({ top: Math.max(0, target.offsetTop - 8), behavior: "auto" });
          onScroll();
        });
      }, 120);
    };
    window.addEventListener("resize", onResize);
    const later = window.setTimeout(measureLayout, 500);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearInterval(spy);
      clearTimeout(later);
    };
  }, [beginProgrammaticScroll, clearResizeAnchor, measureClear, measureTopo, onScroll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      const interactive = isInteractiveShortcutTarget(e.target);
      const eveInput = e.target instanceof HTMLElement && e.target.matches("#eve-command");
      if (useDeck.getState().photo) {
        set({ photo: false });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        if (useDeck.getState().palette) closePalette();
        else openPalette(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        sfx("prompt");
        return;
      }
      if (k === "escape") {
        if (useDeck.getState().palette) closePalette();
        return;
      }
      if (interactive) {
        if (eveInput && (k === "arrowup" || k === "arrowdown")) {
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
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isFlightStopKey(k)) stopFlight();
      const n = ARTICLES.length;
      if (k === "arrowright") {
        const sel = (useDeck.getState().sel + 1) % n;
        selectArticle(sel);
      }
      if (k === "arrowleft") {
        const sel = (useDeck.getState().sel + n - 1) % n;
        selectArticle(sel);
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
      if (k === "t") toggleTour();
      if (k >= "1" && k <= "9") goto(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bit, closePalette, goto, hist, histI, openPalette, selectArticle, set, sfx, stopFlight, toggleTour]);

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
      <img
        src="/plates/command.jpg"
        alt=""
        aria-hidden="true"
        className={`za-stage-poster ${stageOn ? "is-hidden" : ""}`}
      />
      {stageOn && <viewscreen-stage ref={stageRef as unknown as Ref<HTMLElement>} className="za-stage-live" />}
      <div className="za-vignette" />
      <div className="za-spot" aria-hidden />
      <div className="za-scan" />
      <div className={`za-warpflash ${flash ? "on" : ""}`} />
      <div className={`za-sweep ${sweep ? "on" : ""}`} aria-hidden />

      <DesktopCommandRail
        audio={audio}
        deck={deck}
        elapsedMs={flightElapsed}
        hudClassName={hud}
        mode={mode}
        onDeckHover={() => sfx("tick")}
        onNavigate={goto}
        onStopFlight={stopFlight}
        onToggleAudio={toggleAudio}
        onToggleFlight={toggleTour}
        onToggleRail={() => set({ railOpen: !railOpen })}
        railOpen={railOpen}
        tour={tour}
      />

      <MobileFlightControl active={tour} elapsedMs={flightElapsed} onStart={toggleTour} onStop={stopFlight} />

      <CommandHeader
        audio={audio}
        clock={clock}
        craftIndex={craftI}
        deck={deck}
        hudClassName={hud}
        onNavigateCraft={(index) => {
          gotoCraft(index);
          getSound().craft(index, "pip");
        }}
        onOpenNavigator={(opener) => {
          openPalette(opener);
          sfx("prompt");
        }}
        onToggleAudio={toggleAudio}
        tour={tour}
      />

      <main
        id="main-content"
        tabIndex={-1}
        ref={scRef}
        className="za-scroll relative z-10 h-dvh overflow-x-hidden overflow-y-auto md:pl-[68px]"
        style={{ visibility: photo ? "hidden" : "visible" }}
        onPointerDown={stopFlight}
        onWheel={stopFlight}
        onTouchStart={(e) => {
          stopFlight();
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
            <DeckBuilds s5={s5} onSelect={selectArticle} />
            <DeckOperator s6={s6} />
            <DeckEve s7={s7} lines={consoleLines} value={consoleValue} onChange={setConsoleValue} onRun={run} />
          </>
        )}
        <DeckContact s8={s8} onCopy={copyMail} copied={copied} />
        <footer data-hud-clear className="za-mobile-rail-clearance px-6 pb-20 pt-6 md:px-14">
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

      <div
        className={`za-corner-hud fixed bottom-5 right-4 z-40 items-end gap-3 ${deck === 7 ? "hidden" : "flex"} ${hudYield ? "yield" : ""} ${hud}`}
      >
        <div
          className={`za-airframe hidden max-w-[250px] cursor-pointer rounded-[var(--radius-md)] border border-line bg-void/80 p-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-dim hover:border-cyan md:block ${afFlash ? "flash" : ""}`}
          onClick={() => gotoCraft(craftI)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              gotoCraft(craftI);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open ${craft[0]} airframe deck`}
        >
          <div className="flex items-center gap-2">
            <b className="text-cyan">
              AIRFRAME {String(craftI + 1).padStart(2, "0")} / {String(CRAFT.length).padStart(2, "0")}
            </b>
            <span className="za-airframe-compact-name text-ink">{craft[0]}</span>
            {audio && (
              <span className="za-eq ml-auto" aria-hidden>
                <span />
                <span />
                <span />
                <span />
                <span />
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
          className="za-bit-control rounded-full"
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

      <MobileCommandNavigation
        deck={deck}
        hudClassName={hud}
        mode={mode}
        onNavigate={goto}
        onOpenNavigator={openPalette}
      />

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
        <DeckNavigator
          deck={deck}
          onSelect={(index) => {
            paletteOpener.current = null;
            goto(index);
            pendingDestinationFocus.current = index;
          }}
          onClose={closePalette}
        />
      )}

      {rips.map((r) => (
        <span key={r.id} className="za-rip" style={{ left: r.x, top: r.y }} aria-hidden />
      ))}
    </div>
  );
}
