import { useCallback, useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
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
import { eveConsoleLogHeight, shouldYieldAirframeHud } from "@/lib/hud-layout";
import { motionDurationMs } from "@/lib/animation-timing";
import { COMMAND_POSTER_SOURCES } from "@/lib/command-poster";
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
  FLIGHT_DURATION_MS,
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
import { PowerOn } from "./power-on";
import { ViewscreenHud } from "./viewscreen-hud";
import { ExecutiveStill } from "./executive-still";

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
  const stageRef = useRef<ViewscreenStageElement | null>(null);
  const paletteOpener = useRef<HTMLElement | null>(null);
  const cinemaOpener = useRef<HTMLElement | null>(null);
  const cinemaExit = useRef<HTMLButtonElement | null>(null);
  const stillOpener = useRef<HTMLElement | null>(null);
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
  const still = useDeck((s) => s.still);
  const palette = useDeck((s) => s.palette);
  const tour = useDeck((s) => s.tour);
  const railOpen = useDeck((s) => s.railOpen);
  const gate = useDeck((s) => s.gate);
  const prog = useDeck((s) => s.prog);
  const cine = useDeck((s) => s.cine);
  const chapOn = useDeck((s) => s.chapOn);
  const chap = useDeck((s) => s.chap);
  const chapText = useDeck((s) => s.chapText);
  const bitMood = useDeck((s) => s.bitMood);
  const copyEmailState = useDeck((s) => s.copyEmailState);
  const craftLock = useDeck((s) => s.craftLock);
  const set = useDeck((s) => s.set);

  const [consoleValue, setConsoleValue] = useState("");
  const [consoleLines, setConsoleLines] = useState<string[]>(INTRO);
  const [hist, setHist] = useState<string[]>([]);
  const [histI, setHistI] = useState(-1);
  const [clock, setClock] = useState("");
  const [stageOn, setStageOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [flash, setFlash] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [afFlash, setAfFlash] = useState(false);
  const [hudYield, setHudYield] = useState(false);
  const [eveLogHeight, setEveLogHeight] = useState(320);
  const [rips, setRips] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sweep, setSweep] = useState(false);
  const [flightElapsed, setFlightElapsed] = useState(0);
  const jumpUntil = useRef(0);
  const flightTimer = useRef<number | null>(null);
  const flightRun = useRef<FlightState | null>(null);
  const hashTransition = useRef(createHashTransitionState());
  const hashSuppressionTimer = useRef<number | null>(null);
  const resizeAnchorTimer = useRef<number | null>(null);
  const resizeAnchorFrame = useRef(0);
  const warpFlashTimer = useRef<number | null>(null);
  const cineTimer = useRef<number | null>(null);
  const chapterTimer = useRef<number | null>(null);
  const chapterInterval = useRef<number | null>(null);
  const sweepTimer = useRef<number | null>(null);
  const alertTimer = useRef<number | null>(null);
  const copyEmailResetTimer = useRef<number | null>(null);
  const copyEmailAttempt = useRef(0);
  const cinePulseGeneration = useRef(0);
  const pendingSmoothScrollTop = useRef<number | null>(null);
  const gotoRef = useRef<
    ((deck: number, source?: NavigationOrigin, craftOverride?: number | null, articleOverride?: number) => void) | null
  >(null);
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
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    setEveLogHeight(eveConsoleLogHeight({ height: window.innerHeight, width: window.innerWidth }));
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

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
        setEveLogHeight(eveConsoleLogHeight({ height: window.innerHeight, width: window.innerWidth }));
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

  const invalidateCopyEmail = useCallback(() => {
    copyEmailAttempt.current++;
    if (copyEmailResetTimer.current != null) window.clearTimeout(copyEmailResetTimer.current);
    copyEmailResetTimer.current = null;
    set({ copyEmailState: "idle" });
  }, [set]);

  const bit = useCallback(
    (mood: BitMood) => {
      set({ bitMood: mood });
      window.setTimeout(() => {
        if (useDeck.getState().bitMood === mood) set({ bitMood: "idle" });
      }, 1600);
    },
    [set],
  );

  const clearCinePulse = useCallback(() => {
    if (warpFlashTimer.current != null) window.clearTimeout(warpFlashTimer.current);
    if (cineTimer.current != null) window.clearTimeout(cineTimer.current);
    warpFlashTimer.current = null;
    cineTimer.current = null;
    cinePulseGeneration.current += 1;
  }, []);

  const cinePulse = useCallback(() => {
    if (reducedMotion) return;
    clearCinePulse();
    const generation = ++cinePulseGeneration.current;
    set({ cine: true });
    setFlashKey((key) => key + 1);
    setFlash(true);
    warpFlashTimer.current = window.setTimeout(() => {
      if (generation !== cinePulseGeneration.current) return;
      warpFlashTimer.current = null;
      setFlash(false);
    }, motionDurationMs("stage-warp"));
    cineTimer.current = window.setTimeout(() => {
      if (generation !== cinePulseGeneration.current) return;
      cineTimer.current = null;
      set({ cine: false });
    }, 1100);
  }, [clearCinePulse, reducedMotion, set]);

  useEffect(() => clearCinePulse, [clearCinePulse]);

  const clearChapter = useCallback(() => {
    if (chapterInterval.current != null) window.clearInterval(chapterInterval.current);
    if (chapterTimer.current != null) window.clearTimeout(chapterTimer.current);
    chapterInterval.current = null;
    chapterTimer.current = null;
  }, []);

  const clearSweep = useCallback(() => {
    if (sweepTimer.current != null) window.clearTimeout(sweepTimer.current);
    sweepTimer.current = null;
    setSweep(false);
  }, []);

  const clearAlertTimer = useCallback(() => {
    if (alertTimer.current != null) window.clearTimeout(alertTimer.current);
    alertTimer.current = null;
  }, []);

  const settlePendingSmoothScroll = useCallback(() => {
    const top = pendingSmoothScrollTop.current;
    const scroller = scRef.current;
    if (top == null || !scroller) return;
    pendingSmoothScrollTop.current = null;
    scroller.scrollTop = top;
  }, []);

  const chapter = useCallback(
    (i: number) => {
      const name = DECKS[i].name;
      clearChapter();
      if (reducedMotion) {
        set({ chap: i, chapOn: false, chapText: name });
        return;
      }
      const glyphs = "▓▚█≡Ξ01/\\";
      let k = 0;
      set({ chap: i, chapOn: true, chapText: "█" });
      chapterInterval.current = window.setInterval(() => {
        k++;
        const n = Math.ceil(name.length * Math.min(1, k / 9));
        let out = name.slice(0, n);
        if (n < name.length) out += glyphs[(Math.random() * glyphs.length) | 0];
        else {
          if (chapterInterval.current != null) window.clearInterval(chapterInterval.current);
          chapterInterval.current = null;
        }
        set({ chapText: out });
      }, 52);
      chapterTimer.current = window.setTimeout(() => {
        chapterTimer.current = null;
        set({ chapOn: false });
      }, 1450);
    },
    [clearChapter, reducedMotion, set],
  );

  useEffect(() => {
    stageRef.current?.setReducedMotion?.(reducedMotion);
    if (!reducedMotion) return;
    settlePendingSmoothScroll();
    clearCinePulse();
    clearChapter();
    clearSweep();
    setFlash(false);
    set({ cine: false, chapOn: false, chapText: DECKS[useDeck.getState().deck].name });
  }, [clearChapter, clearCinePulse, clearSweep, reducedMotion, set, settlePendingSmoothScroll, stageOn]);

  useEffect(
    () => () => {
      clearChapter();
      clearSweep();
      clearAlertTimer();
    },
    [clearAlertTimer, clearChapter, clearSweep],
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
    pendingSmoothScrollTop.current = null;
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

  const openCinema = useCallback(
    (opener: HTMLElement | null = document.activeElement instanceof HTMLElement ? document.activeElement : null) => {
      cinemaOpener.current = opener && opener !== document.body && opener !== document.documentElement ? opener : null;
      set({ photo: true });
    },
    [set],
  );

  const closeCinema = useCallback(() => {
    const opener = cinemaOpener.current;
    cinemaOpener.current = null;
    set({ photo: false });
    window.requestAnimationFrame(() => {
      const fallback = document.querySelector<HTMLInputElement>("#eve-command");
      (opener?.isConnected ? opener : fallback)?.focus();
    });
  }, [set]);

  const openStill = useCallback(() => {
    const active = document.activeElement;
    stillOpener.current =
      active instanceof HTMLElement && active !== document.body && active !== document.documentElement ? active : null;
    stopFlight();
    set({ still: true, cine: true, mode: "executive", shown: [0, 8] });
    sfx("prompt");
  }, [set, sfx, stopFlight]);
  const closeStill = useCallback(() => {
    const opener = stillOpener.current;
    stillOpener.current = null;
    set({ still: false, cine: false });
    window.requestAnimationFrame(() => {
      if (opener?.isConnected) opener.focus();
    });
  }, [set]);

  useEffect(() => {
    if (!photo) return;
    if (cinemaOpener.current == null) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && active !== document.documentElement)
        cinemaOpener.current = active;
    }
    const frame = window.requestAnimationFrame(() => cinemaExit.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [photo]);

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
      if (reducedMotion) {
        pendingSmoothScrollTop.current = null;
        sc.scrollTop = top;
      } else {
        pendingSmoothScrollTop.current = top;
        sc.scrollTo({ top, behavior: "smooth" });
      }
      const st = stageRef.current;
      if (!reducedMotion) st?.warp?.();
      st?.setDeck?.(i);
      const activeCraftLock = craftOverride === undefined ? useDeck.getState().craftLock : craftOverride;
      st?.setCraft?.(resolveCraftIndex(i, activeCraftLock));
      cinePulse();
      chapter(i);
      if (!reducedMotion) {
        clearSweep();
        setSweep(true);
        sweepTimer.current = window.setTimeout(() => {
          sweepTimer.current = null;
          setSweep(false);
        }, 560);
      }
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
      }, 420);
    },
    [
      beginProgrammaticScroll,
      bit,
      chapter,
      cinePulse,
      clearSweep,
      measureClear,
      reducedMotion,
      set,
      sfx,
      stopFlight,
      syncHash,
    ],
  );

  useEffect(() => {
    gotoRef.current = goto;
  }, [goto]);

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
      gotoRef.current?.(target.deck, "hash", undefined, target.article);
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
  }, [stopFlight, syncHash]);

  useEffect(() => {
    return () => {
      if (flightTimer.current != null) window.clearTimeout(flightTimer.current);
      invalidateCopyEmail();
      clearHashSuppressionTimer();
      clearResizeAnchor();
    };
  }, [clearHashSuppressionTimer, clearResizeAnchor, invalidateCopyEmail]);

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
    const t = window.setTimeout(() => setAfFlash(false), motionDurationMs("deck-copy"));
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
    const pendingTop = pendingSmoothScrollTop.current;
    if (pendingTop != null && Math.abs(sc.scrollTop - pendingTop) <= 1) pendingSmoothScrollTop.current = null;
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
    const measureLayout = () => measureClear();
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
          pendingSmoothScrollTop.current = null;
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
  }, [beginProgrammaticScroll, clearResizeAnchor, measureClear, onScroll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      const interactive = isInteractiveShortcutTarget(e.target);
      const eveInput = e.target instanceof HTMLElement && e.target.matches("#eve-command");
      if (useDeck.getState().still) {
        if (k === "escape") {
          e.preventDefault();
          closeStill();
        }
        return;
      }
      if (useDeck.getState().photo) {
        if (k === "tab") {
          e.preventDefault();
          cinemaExit.current?.focus();
        }
        if (k === "escape") {
          e.preventDefault();
          closeCinema();
        }
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCinema, closePalette, closeStill, hist, histI, openPalette, set, sfx, stopFlight]);

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
    if (res.photo) window.setTimeout(() => openCinema(), 400);
    if (res.alert) {
      set({ alert: true });
      sfx("klaxon");
      clearAlertTimer();
      alertTimer.current = window.setTimeout(() => {
        alertTimer.current = null;
        set({ alert: false });
      }, 1900);
    }
  };

  const engage = () => {
    if (mode !== "executive") {
      goto(1);
      return;
    }
    const brief = sBrief.current;
    const scroller = scRef.current;
    if (!brief || !scroller) return;
    if (reducedMotion) {
      pendingSmoothScrollTop.current = null;
      scroller.scrollTop = brief.offsetTop;
    } else {
      pendingSmoothScrollTop.current = brief.offsetTop;
      scroller.scrollTo({ top: brief.offsetTop, behavior: "smooth" });
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
    const attempt = ++copyEmailAttempt.current;
    if (copyEmailResetTimer.current != null) window.clearTimeout(copyEmailResetTimer.current);
    copyEmailResetTimer.current = null;
    set({ copyEmailState: "idle" });

    if (typeof navigator.clipboard?.writeText !== "function") {
      set({ copyEmailState: "error" });
      sfx("err");
      return;
    }

    try {
      await navigator.clipboard.writeText("doug@cashio.us");
    } catch {
      if (copyEmailAttempt.current !== attempt) return;
      set({ copyEmailState: "error" });
      sfx("err");
      return;
    }
    if (copyEmailAttempt.current !== attempt) return;
    set({ copyEmailState: "success" });
    sfx("ok");
    sfx("hail");
    copyEmailResetTimer.current = window.setTimeout(() => {
      copyEmailResetTimer.current = null;
      if (copyEmailAttempt.current === attempt && useDeck.getState().copyEmailState === "success") {
        set({ copyEmailState: "idle" });
      }
    }, 2200);
  };

  const overlay = photo || still;
  const hud = overlay ? "pointer-events-none invisible opacity-0" : "";
  const craftI = resolveCraftIndex(deck, craftLock);
  const craft = CRAFT[craftI];
  const dleft = daysLeft();
  const flightBeat = flightActionAt(flightElapsed);
  const beatLabel = flightBeat.kind === "complete" ? "CONTACT" : flightBeat.label;

  return (
    <div
      className={`relative h-dvh overflow-hidden bg-void text-ink ${!gate && !overlay ? "za-systems-online" : ""} ${reducedMotion ? "za-prefers-static" : ""}`}
      style={
        {
          "--za-deck-copy-duration": `${motionDurationMs("deck-copy")}ms`,
          "--za-article-acquisition-duration": `${motionDurationMs("article-acquisition")}ms`,
          "--za-stage-warp-duration": `${motionDurationMs("stage-warp")}ms`,
        } as CSSProperties
      }
    >
      <div inert={overlay || gate || undefined} aria-hidden={overlay || gate || undefined}>
        {!overlay && (
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-[200] bg-void text-cyan focus:not-sr-only focus:rounded-lg focus:border focus:border-cyan focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:outline-none"
          >
            Skip to content
          </a>
        )}
        <picture>
          {COMMAND_POSTER_SOURCES.map((source) => (
            <source key={source.type} {...source} />
          ))}
          <img
            src="/plates/command.jpg"
            alt=""
            aria-hidden="true"
            width={1680}
            height={945}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className={`za-stage-poster ${stageOn ? "is-hidden" : ""}`}
          />
        </picture>
        {stageOn && <viewscreen-stage ref={stageRef as unknown as Ref<HTMLElement>} className="za-stage-live" />}
        <div className="za-vignette" />
        <div className="za-spot" aria-hidden />
        <div className="za-scan" />
        <div className={`za-flight-streaks ${tour && !gate && !overlay ? "on" : ""}`} aria-hidden />
        <ViewscreenHud
          online={!gate && !overlay && deck !== 7}
          tour={tour}
          craftName={craft[0]}
          clock={clock}
          beatLabel={beatLabel}
          elapsedMs={flightElapsed}
          reducedMotion={reducedMotion}
        />
        <div key={flashKey} className={`za-warpflash ${flash ? "on" : ""}`} />
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

        {!overlay && (
          <MobileFlightControl active={tour} elapsedMs={flightElapsed} onStart={toggleTour} onStop={stopFlight} />
        )}

        <CommandHeader
          audio={audio}
          clock={clock}
          craftIndex={craftI}
          deck={deck}
          hudClassName={hud}
          railOpen={railOpen}
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
          data-active-deck={deck}
          className={`za-scroll relative z-10 h-dvh overflow-x-hidden overflow-y-auto ${railOpen ? "md:pl-[220px]" : "md:pl-[68px]"}`}
          style={{ visibility: overlay ? "hidden" : "visible" }}
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
            onEngage={engage}
            onEve={() => goto(7)}
            onFlight={toggleTour}
            onStill={openStill}
          />
          {mode === "executive" && <DeckBrief sBrief={sBrief} />}
          {mode === "technical" && (
            <>
              <DeckGrid s1={s1} />
              <DeckRouting s2={s2} />
              <DeckIron s3={s3} />
              <DeckLineage s4={s4} />
              <DeckBuilds s5={s5} onSelect={selectArticle} />
              <DeckOperator s6={s6} />
              <DeckEve
                s7={s7}
                active={!overlay && deck === 7}
                lines={consoleLines}
                value={consoleValue}
                logHeight={eveLogHeight}
                onChange={setConsoleValue}
                onRun={run}
              />
            </>
          )}
          <DeckContact s8={s8} onCopy={copyMail} copyEmailState={copyEmailState} />
          <footer data-hud-clear className="za-mobile-rail-clearance px-6 pb-20 pt-6 md:px-14">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 za-mono text-[10px] text-dim">
              <span>{RELEASE}</span>
              <span>REVISED {REVISED}</span>
              <span className="inline-flex items-center gap-2 text-cyan">
                <span className="za-lock-pip" />
                {dleft > 0 ? "DATED EXPORT VALID" : "DATED EXPORT EXPIRED"}
              </span>
              <span>FIGURES VERIFIED {VERIFIED_LONG}</span>
              <span>VALID THRU {dleft > 0 ? EXPIRES_SHORT : "— TREAT AS HISTORY"}</span>
              <span>ZERO INFRASTRUCTURE CALLS</span>
            </div>
          </footer>
        </main>

        <div
          data-cine={cine}
          className={`za-chapter-overlay pointer-events-none fixed bottom-[118px] left-[calc(68px+5vw)] z-40 ${
            reducedMotion ? "" : "transition-[opacity,transform] duration-500"
          } ${chapOn ? "opacity-100" : "translate-y-4 opacity-0"} ${hud}`}
        >
          <span className="za-chapter-cap" aria-hidden />
          <div className="za-kicker">DECK {String(chap + 1).padStart(2, "0")} / 09</div>
          <div className="za-display mt-2 text-[clamp(2rem,4.4vw,3.6rem)] drop-shadow-[0_0_28px_rgba(0,249,255,0.25)]">
            {chapText}
          </div>
          <div className="za-mono mt-2 max-w-[52ch] text-[11px] text-dim">{DECKS[chap].tag}</div>
          {tour ? (
            <div className="za-vs-meter mt-4 max-w-xs">
              <span style={{ width: `${Math.min(100, (flightElapsed / FLIGHT_DURATION_MS) * 100)}%` }} />
            </div>
          ) : null}
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
              <span data-airframe-compact-identity className="za-airframe-compact-name text-ink">
                {craft[0]}
              </span>
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
                <div
                  className="za-airframe-progress h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${prog}%` }}
                />
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
            <BitMascot active={!overlay && deck !== 7} mood={bitMood} size={hudYield ? 72 : 104} />
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
          className={`za-cinema-bar pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[9vh] border-b border-line bg-[#04050a] ${
            reducedMotion ? "" : "transition-transform duration-700"
          } ${cine ? "translate-y-0" : "-translate-y-full"}`}
        />
        <div
          aria-hidden
          className={`za-cinema-bar pointer-events-none fixed bottom-0 left-0 right-0 z-[60] h-[9vh] border-t border-line bg-[#04050a] ${
            reducedMotion ? "" : "transition-transform duration-700"
          } ${cine ? "translate-y-0" : "translate-y-full"}`}
        />

        {alert && (
          <>
            <div
              aria-hidden
              className={`pointer-events-none fixed inset-0 z-[70] border-[3px] border-red shadow-[inset_0_0_150px_rgba(255,0,51,0.45)] ${
                reducedMotion ? "" : "animate-[za-redpulse_1.1s_ease_infinite]"
              }`}
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

      {gate && (
        <PowerOn
          reducedMotion={reducedMotion}
          onDone={() => {
            set({ gate: false, bitMood: "yes" });
            cinePulse();
            if (!reducedMotion) {
              clearSweep();
              setSweep(true);
              sweepTimer.current = window.setTimeout(() => {
                sweepTimer.current = null;
                setSweep(false);
              }, 560);
            }
            window.setTimeout(() => {
              if (useDeck.getState().bitMood === "yes") set({ bitMood: "idle" });
            }, 1600);
          }}
        />
      )}

      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cinema view"
          className="pointer-events-none fixed inset-0 z-[100] flex flex-col justify-between p-5 md:p-10"
        >
          <div className="za-display max-w-max border border-cyan/60 bg-void/70 px-4 py-3 text-[11px] tracking-[0.2em] text-cyan shadow-[0_0_28px_rgba(0,249,255,0.2)]">
            CINEMA VIEW · PRESS ESC OR EXIT CINEMA
          </div>
          <button
            ref={cinemaExit}
            type="button"
            className="za-btn pointer-events-auto self-end px-5 py-3 text-[11px]"
            onClick={closeCinema}
          >
            EXIT CINEMA
          </button>
        </div>
      )}

      {still && <ExecutiveStill onClose={closeStill} />}
    </div>
  );
}
