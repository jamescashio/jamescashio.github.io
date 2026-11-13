import { motionEnabled } from "./motion.ts";

/**
 * The passage between the front door and a room. In browsers that carry a view across a page change,
 * the world card a visitor chose opens into its room, and on the way back the room folds into its card.
 * The stylesheets do all of it: each card and its room share a name. This only holds the passage still
 * when motion is paused, which a stylesheet cannot know before the page's script has read the setting.
 */
type Passage = { skipTransition(): void };
type Carried = Event & { viewTransition?: Passage | null };

export function mountPassage() {
  const still = (event: Event) => {
    if (!motionEnabled()) (event as Carried).viewTransition?.skipTransition();
  };
  addEventListener("pageswap", still);
  addEventListener("pagereveal", still);
  // This script can start after the page was revealed; a passage already under way is ended here.
  if (!motionEnabled())
    (document as Document & { activeViewTransition?: Passage | null }).activeViewTransition?.skipTransition();
}
