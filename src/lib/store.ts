import { create } from "zustand";
import { DEFAULT_AUDIO_ENABLED } from "./audio-policy";
import { DECKS } from "./content";

export type Mode = "technical" | "executive";
export type BitMood = "idle" | "yes" | "no" | "alert" | "think";
export type CopyEmailState = "idle" | "success" | "error";

interface DeckStore {
  gate: boolean;
  deck: number;
  mode: Mode;
  audio: boolean;
  alert: boolean;
  photo: boolean;
  still: boolean;
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
  copyEmailState: CopyEmailState;
  craftLock: number | null;
  set: (p: Partial<DeckStore>) => void;
}

export const useDeck = create<DeckStore>((set) => ({
  gate: false,
  deck: 0,
  mode: "technical",
  audio: DEFAULT_AUDIO_ENABLED,
  alert: false,
  photo: false,
  still: false,
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
  copyEmailState: "idle",
  craftLock: null,
  set: (p) => set(p),
}));
