let resolveClientReady: (() => void) | null = null;

export const clientReady = new Promise<void>((resolve) => {
  resolveClientReady = resolve;
});

export function markClientReady() {
  resolveClientReady?.();
  resolveClientReady = null;
}
