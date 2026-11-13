import { motionEnabled } from "./motion.ts";

/**
 * The passage between the front door and a room. In browsers that carry a view across a page change,
 * the world card a visitor chose opens into its room, and on the way back the room folds into its card.
 * The stylesheets carry it: each card and its room share a name. public/passage.js, in the head, keeps the
 * passage to the pages that take part. This holds it still when motion is paused during the visit.
 */
type Passage = { ready: Promise<void>; skipTransition(): void };
type Carried = Event & { viewTransition?: Passage | null };

function end(passage: Passage | null | undefined) {
  if (!passage) return;
  // An ended passage rejects its ready promise; nothing waits on it, so say so.
  passage.ready.catch(() => {});
  passage.skipTransition();
}

export function mountPassage() {
  const still = (event: Event) => {
    if (!motionEnabled()) end((event as Carried).viewTransition);
  };
  addEventListener("pageswap", still);
  addEventListener("pagereveal", still);
  // This script can start after the page was revealed; a passage already under way is ended here.
  if (!motionEnabled()) end((document as Document & { activeViewTransition?: Passage | null }).activeViewTransition);
}
