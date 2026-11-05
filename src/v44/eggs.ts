/** Small kindnesses: a toast, copying the address, and the words the page answers when typed. */

export function toast(text: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function mountEggs(surge: (ms: number) => void) {
  // Copy the address, with a fallback the visitor can still read.
  document.querySelector("[data-copy-email]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("doug@cashio.us");
      toast("Copied doug@cashio.us");
    } catch {
      toast("Copy blocked here. The address is doug@cashio.us");
    }
  });

  // Typed eggs, outside form fields.
  let typed = "";
  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]") || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-12);
    if (typed.endsWith("zoom")) {
      surge(1600);
      toast("Engaging. Hold on to something that is not a houseplant.");
    } else if (typed.endsWith("drummer")) {
      toast("Captain on deck.");
    }
  });
}
