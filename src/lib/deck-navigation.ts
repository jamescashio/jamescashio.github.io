import { ARTICLES, DECKS } from "./content.ts";

export type DeckHashState = {
  deck: number;
  article: number;
};

export type NavigationOrigin = "manual" | "flight" | "hash" | "restore";

export type HashTransitionState = {
  pendingInternalHash: string | null;
  restoringDeck: number | null;
};

const BUILDS_DECK_ID = "builds";
const FALLBACK: DeckHashState = { deck: 0, article: 0 };

export function createHashTransitionState(): HashTransitionState {
  return { pendingInternalHash: null, restoringDeck: null };
}

export function recordInternalHashWrite(state: HashTransitionState, hash: string): HashTransitionState {
  return { ...state, pendingInternalHash: hash };
}

export function classifyHashChange(state: HashTransitionState, hash: string) {
  if (state.pendingInternalHash === hash) {
    return { kind: "internal" as const, state: { ...state, pendingInternalHash: null } };
  }
  return { kind: "external" as const, state: createHashTransitionState() };
}

export function beginHashRestore(state: HashTransitionState, deck: number): HashTransitionState {
  return { ...state, restoringDeck: deck };
}

export function cancelHashRestore(state: HashTransitionState): HashTransitionState {
  return { ...state, restoringDeck: null };
}

export function consumeScrollDeck(state: HashTransitionState, deck: number) {
  if (state.restoringDeck == null) return { writeHash: true, updateDeck: true, state };
  if (state.restoringDeck === deck) {
    return { writeHash: false, updateDeck: true, state: { ...state, restoringDeck: null } };
  }
  return { writeHash: false, updateDeck: false, state };
}

export function shouldStopFlightForNavigation(origin: NavigationOrigin) {
  return origin === "manual";
}

export function shouldWriteHashForNavigation(origin: NavigationOrigin) {
  return origin === "manual" || origin === "flight";
}

export function hashWriteModeForNavigation(origin: NavigationOrigin) {
  if (origin === "manual") return "push" as const;
  if (origin === "flight") return "replace" as const;
  return null;
}

export function shouldAnimateNavigation(origin: NavigationOrigin, reducedMotion: boolean) {
  return origin !== "restore" && !reducedMotion;
}

function safeDeckIndex(value: number) {
  return Number.isFinite(value) && value >= 0 && value < DECKS.length ? Math.trunc(value) : 0;
}

function clampArticle(value: string | null) {
  if (value == null || !/^\d+$/.test(value)) return 0;
  return Math.max(0, Math.min(ARTICLES.length - 1, Number(value) - 1));
}

export function parseDeckHash(hash: string): DeckHashState {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const deck = DECKS.findIndex((candidate) => candidate.id === params.get("deck"));
  if (deck < 0) return { ...FALLBACK };

  return {
    deck,
    article: DECKS[deck].id === BUILDS_DECK_ID ? clampArticle(params.get("article")) : 0,
  };
}

export function formatDeckHash({ deck, article }: DeckHashState) {
  const target = DECKS[safeDeckIndex(deck)];
  if (target.id !== BUILDS_DECK_ID) return `#deck=${target.id}`;

  const safeArticle = Number.isFinite(article) ? Math.max(0, Math.min(ARTICLES.length - 1, Math.trunc(article))) : 0;
  return `#deck=${target.id}&article=${safeArticle + 1}`;
}
