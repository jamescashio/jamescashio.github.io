/**
 * A toast, and copying the address with a fallback the visitor can still read. The page answers no
 * typed shortcuts of its own; its eggs live in E.V.E., where typing is the visitor's choice.
 */

export function toast(text: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function mountCopyEmail() {
  document.querySelector("[data-copy-email]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("doug@cashio.us");
      toast("Copied doug@cashio.us");
    } catch {
      toast("Copy blocked here. The address is doug@cashio.us");
    }
  });
}
