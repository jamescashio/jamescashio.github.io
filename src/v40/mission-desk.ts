// A visual index into existing destinations. Search and previews stay in this browser.
const groups = ["All", "Explore", "Try", "Watch", "Connect"];
// Guided routes, keyed by the ids in discovery-routes.ts. They reuse the opening's three doors so they never
// read like the filters above them, and stay inline because this module is evaluated without imports in tests.
const routeNames: Record<string, string> = {
  worlds: "Find your world",
  lab: "Make something click",
  cinema: "Enter the cinema",
};
const descriptions: Record<string, string> = {
  top: "Begin at the observatory.",
  contact: "Speaking, mentoring and comparing notes.",
  "eagle-film": "An unlikely crew. A 61 second escape.",
  workshop: "Real projects, clear questions, inspectable results.",
  studies: "Seven experiments. Change an input. See why.",
  rooms: "Starship, principles, studios and flight heritage.",
  films: "Original films and an independent design study.",
  work: "One document. A privacy decision.",
  universe: "Follow a request from question to review.",
  evidence: "Dated observations, sources and visible unknowns.",
  operator: "The builder behind the worlds.",
};
const scenes: Record<string, [string, string, string, string]> = {
  top: [
    "Explore",
    "/v41/first-light-observatory-960.webp",
    "The next horizon.",
    "A starship to board, a question to try, and a universe made after hours.",
  ],
  contact: [
    "Connect",
    "/v40/thumbs/zenith-starship-blue-hour-poster-640.webp",
    "Open a channel.",
    "Bring a difficult question. Compare notes, talk about a project, or simply say hello.",
  ],
  "eagle-film": [
    "Watch",
    "/assets/hero/cashio-trailer-poster.webp",
    "An unlikely crew.",
    "House Cashio in 61 seconds. A subscription villain, a hobby lab, and one unimpressed cat.",
  ],
  workshop: [
    "Explore",
    "/v40/thumbs/zenith-starship-blue-hour-poster-640.webp",
    "Made after hours.",
    "A backup with a receipt. A brief you can take with you. See the question behind the work.",
  ],
  studies: [
    "Try",
    "/v40/thumbs/room-principles-640.webp",
    "Your input. A consequence.",
    "Seven small experiments about private data, evidence and knowing when to ask a person.",
  ],
  rooms: [
    "Explore",
    "/v40/thumbs/room-starship-640.webp",
    "Four ways to explore.",
    "Fly a system, turn a principle, follow the light or borrow a test pilot’s question.",
  ],
  films: [
    "Watch",
    "/v40/thumbs/room-studios-threshold-640.webp",
    "Stay for the atmosphere.",
    "Original short films, The Sovereign and the Roadster design study. Start with what catches your eye.",
  ],
  work: [
    "Try",
    "/v40/thumbs/room-principles-640.webp",
    "A boundary you decide.",
    "One document. A privacy decision. See where a useful tool should stop and ask.",
  ],
  universe: [
    "Try",
    "/v40/thumbs/room-starship-640.webp",
    "Follow the request.",
    "Trace an illustrated path from a human question to a human decision.",
  ],
  evidence: [
    "Explore",
    "/v40/thumbs/zenith-celestial-signature-poster-640.webp",
    "Trust has a timestamp.",
    "Inspect the dated public record, its sources, and what remains unmeasured.",
  ],
  operator: [
    "Connect",
    "/v40/thumbs/zenith-starship-blue-hour-poster-640.webp",
    "The human in command.",
    "Meet Doug. Security by day, aviation and science fiction after hours, curiosity throughout.",
  ],
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c as "&" | "<" | ">" | '"' | "'"],
  );

export function missionDeskMarkup(
  chapters: readonly (readonly [string, string, string])[],
  presentation: { name: string; versionLabel: string },
) {
  return `<div class="mission-head"><div><span class="mission-eyebrow">THE cAshIo OBSERVATORY</span><h2 id="mission-title">Mission Control</h2></div><button type="button" data-mission-close aria-label="Close Mission Control">ESC ×</button></div>
    <div class="mission-toolbar"><label class="mission-search"><span>Where are we going?</span><input type="search" placeholder="Find a world, experiment or answer…" autocomplete="off" aria-controls="mission-results"></label>
    <div class="mission-categories" role="group" aria-label="Filter destinations">${groups.map((group) => `<button type="button" data-mission-group="${group}" aria-pressed="${group === "All"}">${group}</button>`).join("")}</div>
    <div class="mission-routes" role="group" aria-label="Guided routes"><span class="mission-routes-label">Or take a guided route</span>${Object.entries(
      routeNames,
    )
      .map(
        ([id, name]) =>
          `<button type="button" data-mission-route="${id}">${escape(name)} <span aria-hidden="true">↗</span></button>`,
      )
      .join("")}</div>
    <div class="mission-results-meta"><span role="status" aria-live="polite" data-mission-count></span><span aria-hidden="true">↑ ↓ to browse · Enter to go</span></div></div>
    <div class="mission-body"><nav id="mission-results" class="mission-results" aria-label="All chapters">${chapters.map(([id, title, desc], i) => `<a href="#${id}" data-chapter="${id}" data-search="${escape((title + " " + desc).toLowerCase())}" data-group="${scenes[id][0]}" aria-label="${String(i + 1).padStart(2, "0")} ${escape(title)}" aria-describedby="mission-desc-${id}"><small>${String(i + 1).padStart(2, "0")}</small><span class="mission-row-copy"><strong>${escape(title)}</strong><span id="mission-desc-${id}" class="mission-description">${escape(descriptions[id])}</span></span><span class="mission-arrow" aria-hidden="true">↗</span></a>`).join("")}
    <div class="mission-empty" hidden><p>No matching destination. Try “films” or “Doug”.</p><button type="button" data-mission-reset>Show all destinations</button></div></nav>
    <aside class="mission-preview" aria-label="Destination preview"><div class="mission-preview-art"><img width="640" height="400" alt="" decoding="async"><span aria-hidden="true" class="mission-viewfinder"></span><span class="mission-preview-number" aria-hidden="true"></span></div><div class="mission-preview-copy"><span class="mission-preview-category"></span><h3></h3><p></p><span class="mission-preview-hint">Choose a destination to begin ↗</span></div><div class="mission-orbit-mark" aria-hidden="true">cAshIo / A CURIOUS UNIVERSE</div></aside></div>
    <div class="mission-foot"><span>${escape(presentation.versionLabel)} · ${escape(presentation.name)}<br>Human in command. Towel optional.</span><button type="button" data-motion-toggle>Pause motion</button></div>`;
}

export function bindMissionDesk(panel: HTMLDialogElement) {
  const input = panel.querySelector<HTMLInputElement>("input")!;
  const links = [...panel.querySelectorAll<HTMLAnchorElement>("[data-chapter]")];
  const preview = panel.querySelector<HTMLElement>(".mission-preview")!;
  const image = preview.querySelector<HTMLImageElement>("img")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const widePreview = matchMedia("(min-width: 701px)");
  let group = "All";
  let active: HTMLAnchorElement | null | undefined;
  function cancelMotion() {
    image.getAnimations().forEach((animation) => animation.cancel());
  }
  function reveal() {
    cancelMotion();
    if (panel.open && !document.hidden && !reduced.matches && document.documentElement.dataset.motion !== "off") {
      image.animate(
        [
          { opacity: 0.55, transform: "scale(1.035)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 420, easing: "cubic-bezier(.2,.7,.3,1)" },
      );
    }
  }
  function choose(link: HTMLAnchorElement | null | undefined) {
    if (!link || link === active) return;
    active = link;
    links.forEach((item) => {
      item.dataset.previewActive = String(item === link);
    });
    const [category, src, title, description] = scenes[link.dataset.chapter!];
    preview.hidden = false;
    preview.querySelector<HTMLElement>(".mission-preview-category")!.textContent =
      category + " / " + link.querySelector<HTMLElement>("strong")!.textContent;
    preview.querySelector<HTMLElement>("h3")!.textContent = title;
    preview.querySelector<HTMLElement>("p")!.textContent = description;
    preview.querySelector<HTMLElement>(".mission-preview-number")!.textContent =
      link.querySelector<HTMLElement>("small")!.textContent;
    // A closed menu does not fetch preview artwork.
    if (panel.open && widePreview.matches && image.getAttribute("src") !== src) image.src = src;
  }
  function filter() {
    const query = input.value.trim().toLowerCase();
    const visible = links.filter((link) => {
      link.hidden = !(group === "All" || link.dataset.group === group) || !(link.dataset.search ?? "").includes(query);
      return !link.hidden;
    });
    panel.querySelector<HTMLElement>(".mission-empty")!.hidden = visible.length > 0;
    panel.querySelector<HTMLElement>("[data-mission-count]")!.textContent =
      `${visible.length} ${visible.length === 1 ? "destination" : "destinations"}`;
    panel.querySelector<HTMLElement>(".mission-results")!.scrollTop = 0;
    if (visible.length) choose(visible[0]);
    else {
      active = null;
      preview.hidden = true;
      cancelMotion();
    }
  }
  function reset() {
    group = "All";
    input.value = "";
    active = null;
    panel
      .querySelectorAll<HTMLElement>("[data-mission-group]")
      .forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.missionGroup === group)));
    filter();
  }
  input.addEventListener("input", filter);
  image.addEventListener("load", reveal);
  panel.addEventListener("close", cancelMotion);
  document.addEventListener("cashio-motion", cancelMotion);
  document.addEventListener("visibilitychange", cancelMotion);
  reduced.addEventListener("change", cancelMotion);
  widePreview.addEventListener("change", () => {
    if (widePreview.matches && panel.open && active) image.src = scenes[active.dataset.chapter!][1];
  });
  panel.addEventListener("pointerover", (event) =>
    choose(event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("[data-chapter]") : null),
  );
  panel.addEventListener("focusin", (event) =>
    choose(event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("[data-chapter]") : null),
  );
  panel.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>("[data-mission-group]");
    if (button) {
      group = button.dataset.missionGroup!;
      panel
        .querySelectorAll<HTMLElement>("[data-mission-group]")
        .forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      filter();
    }
    if (event.target.closest<HTMLElement>("[data-mission-reset]")) {
      reset();
      input.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target !== input && !event.target.closest<HTMLAnchorElement>("[data-chapter]")) return;
    const visible = links.filter((link) => !link.hidden);
    if (!visible.length) return;
    if (event.key === "Enter" && event.target === input) {
      event.preventDefault();
      (active || visible[0]).click();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      if (event.target === input && ["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = visible.indexOf(event.target.closest<HTMLAnchorElement>("[data-chapter]")!);
      const index =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? visible.length - 1
            : event.key === "ArrowDown"
              ? (current + 1) % visible.length
              : (current - 1 + visible.length) % visible.length;
      visible[event.target === input && event.key === "ArrowUp" ? visible.length - 1 : index].focus();
    }
  });
  return { reset };
}
