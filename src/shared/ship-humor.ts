/** Shared by the V44 front door and the preserved V43 edition, so neither owns the other. */
const foldReplies = [
  "Space folded. The fitted sheet remains undefeated.",
  "Shortcut found. The scenic route has filed an appeal.",
  "Reality rearranged. Please keep your coffee upright.",
  "Space folded again. The universe requests a lunch break.",
];

export function foldReply(count: number) {
  return foldReplies[(Math.max(1, count) - 1) % foldReplies.length];
}

export const bitJokes = [
  "I tried to fold space. The fitted sheet is still winning.",
  "My plan for world domination was rejected. Apparently I need a parking permit.",
  "Why did the spaceship miss its meeting? Too many launch windows.",
  "I contain multitudes. Mostly triangles.",
];
