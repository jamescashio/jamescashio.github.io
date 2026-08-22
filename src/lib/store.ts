import { create } from "zustand";
import { DECKS } from "./content";

export type Mode = "technical" | "executive";
export type BitMood = "idle" | "yes" | "no" | "alert" | "think";

interface DeckStore {
  gate: boolean;
  deck: number;
  mode: Mode;
  audio: boolean;
  alert: boolean;
  photo: boolean;
  palette: boolean;
  tour: boolean;
  railOpen: boolean;
  sel: number;
  prog: number;
  boot: string[];
  shown: number[];
  bitMood: BitMood;
  cine: boolean;
  chapOn: boolean;
  chap: number;
  chapText: string;
  copied: boolean;
  craftLock: number | null;
  set: (p: Partial<DeckStore>) => void;
}

export const useDeck = create<DeckStore>((set) => ({
  gate: false,
  deck: 0,
  mode: "technical",
  audio: true,
  alert: false,
  photo: false,
  palette: false,
  tour: false,
  railOpen: false,
  sel: 0,
  prog: 0,
  boot: [],
  shown: [0],
  bitMood: "idle",
  cine: false,
  chapOn: false,
  chap: 0,
  chapText: DECKS[0].name,
  copied: false,
  craftLock: null,
  set: (p) => set(p),
}));
