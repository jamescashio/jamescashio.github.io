export function nextFocusIndex(currentIndex: number, count: number, backwards: boolean) {
  if (count <= 0) return -1;
  if (currentIndex < 0 || currentIndex >= count) return backwards ? count - 1 : 0;
  return (currentIndex + (backwards ? -1 : 1) + count) % count;
}

export function isInteractiveShortcutTarget(target: EventTarget | null) {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return Boolean(
    (target as Element).closest(
      'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="checkbox"], [role="combobox"], [role="link"], [role="menuitem"], [role="option"], [role="radio"], [role="slider"], [role="spinbutton"], [role="switch"], [role="tab"], [role="textbox"], [role="treeitem"]',
    ),
  );
}
