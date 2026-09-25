/** Search and menu focus stay independent from room, scene and browser-history routing. */
export function setupMissionControl({ studies, canOpen, onToggle }) {
  const dialog = document.querySelector("#mc");
  const search = document.querySelector("#mc-search");
  const list = document.querySelector("#mc-list");
  const content = document.querySelector(".mc-content");
  const start = document.querySelector("#mc-start");
  const results = document.querySelector("#mc-results");
  const clear = document.querySelector("#mc-clear");
  document.querySelector("#mc-btn .mono").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  let previousFocus = null;
  let navigating = false;
  const featured = new Set(["#studies", "#rooms", "#glossary", "#evidence", "#contact"]);
  const destinations = [
    ["Explore the starship", "Your pace. A 30 second tour when you choose.", "#flight=board"],
    ["The orbital world", "Return to the beginning.", "#top"],
    ["Seven studies", "Choose a question and test its rule.", "#studies", "experiments workbench"],
    ["Four rooms", "Architecture, principles, creative studios and aviation.", "#rooms"],
    [
      "Glossary",
      "The names used here, in plain English.",
      "#glossary",
      "names definitions acronyms hermes dsh zeus apollo atlas bit eve r-01 workhorse research synthesis lanes",
    ],
    [
      "Start here: try one decision",
      "Predict the route. Test the privacy boundary.",
      "#work",
      "privacy private data test",
    ],
    [
      "The system map",
      "Meet Zeus and Apollo, the scheduler and the operator console.",
      "#request-journey",
      "servers hosts hermes dsh atlas universe machines",
    ],
    [
      "Compare architectures",
      "Its own page. Change a mission and inspect all twelve requests.",
      "#starship",
      "privacy cloud local boundary",
    ],
    ["Starship build story", "A blank quiet scene, the one-frame repair and its regression check.", "#build-story"],
    ["Principles Engine", "Its own page. Turn the rings and see the design decision behind each rule.", "#principles"],
    ["The Studios", "Its own page. Original worlds, the 3D signature and five short films.", "#studios"],
    ["Lensing Observatory", "Sculpt the light. Find your own perspective.", "#lensing"],
    ["Celestial Forge", "Explore the signature in three dimensions.", "#signature"],
    ["The Cinema", "Five original short films. Play at your own pace.", "#film=lightwake"],
    ["The Sanctuary", "A quiet film and an explorable inner world.", "#film=sanctuary"],
    [
      "Inspect the evidence",
      "A source, a date, and a clear boundary. Fleet facts and the E.V.E. console.",
      "#evidence",
      "eve fleet status proof privacy boundary withheld",
    ],
    [
      "Flight heritage",
      "Its own page. Four aviation pioneers and the discipline behind the design.",
      "#heritage",
      "yeager johnson rutan hoover aviation pilots x-1 sr-71",
    ],
    ["Meet Doug", "Builder. Operator. Accountable human.", "#operator", "about career resume linkedin"],
    [
      "Privacy",
      "How this site handles data. Read the policy on GitHub.",
      "https://github.com/jamescashio/jamescashio.github.io/blob/main/PRIVACY.md",
      "privacy policy cookies",
    ],
    [
      "Compare notes",
      "Speaking, advising or comparing notes. Email Doug.",
      "#contact",
      "contact email talk hire hello speaking advising recruiter",
    ],
    ...studies.map((s) => [`${s.name} · ${s.code}`, s.cue, `#build=${s.id}`, s.q]),
  ];
  function render(query = "") {
    list.replaceChildren();
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    // Short terms match at the start of a word, so "eve" finds E.V.E. rather than "Seven".
    // Titles outrank descriptions, and descriptions outrank hidden keywords.
    const matcher = (term) =>
      term.length < 4
        ? new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
        : { test: (text) => text.includes(term) };
    const ranked = [];
    destinations.forEach(([name, body, , keywords = ""], order) => {
      const fields = [name, body, keywords].map((field) => field.toLowerCase().replace(/\./g, ""));
      let score = 0;
      for (const term of terms) {
        const test = matcher(term.replace(/\./g, ""));
        const field = fields.findIndex((text) => test.test(text));
        if (field < 0) return;
        score += 3 - field;
      }
      ranked.push({ score, order, destination: destinations[order] });
    });
    const available = ranked.sort((a, b) => b.score - a.score || a.order - b.order).map((entry) => entry.destination);
    const matches = terms.length ? available : destinations.filter(([, , href]) => featured.has(href));
    clear.hidden = search.value.length === 0;
    results.textContent = terms.length
      ? `${matches.length} ${matches.length === 1 ? "destination" : "destinations"} found`
      : "Search the whole workshop";
    start.hidden = terms.length > 0;
    content.scrollTop = 0;
    for (const [name, body, href] of matches) {
      const a = document.createElement("a");
      a.className = "tile mc-destination";
      a.href = href;
      const title = document.createElement("strong"),
        description = document.createElement("span");
      title.textContent = name;
      description.textContent = body;
      a.append(title, description);
      list.append(a);
    }
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "mc-empty";
      empty.textContent =
        "No match yet. Try ‘flight’, ‘signature’ or ‘Graphify’, or clear the search to return to the starting paths.";
      list.append(empty);
    }
  }
  function open() {
    if (dialog.open || !canOpen()) return;
    const active = document.activeElement;
    previousFocus = active && active !== document.body ? active : document.getElementById("mc-btn");
    navigating = false;
    search.value = "";
    render();
    dialog.showModal();
    onToggle();
    search.focus();
  }
  dialog.addEventListener("close", () => {
    onToggle();
    if (!navigating && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  document.querySelector("#mc-btn").addEventListener("click", open);
  document.querySelector("#mc-close").addEventListener("click", () => dialog.close());
  search.addEventListener("input", () => render(search.value.trim().toLowerCase()));
  clear.addEventListener("click", () => {
    search.value = "";
    render();
    search.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    const links = [...(start.hidden ? [] : start.querySelectorAll("a")), ...list.querySelectorAll("a")];
    if (!links.length) return;
    const index = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      links[index < 0 ? (offset === 1 ? 0 : links.length - 1) : (index + offset + links.length) % links.length].focus();
    } else if (event.key === "Enter" && document.activeElement === search) {
      event.preventDefault();
      links[0].click();
    }
  });
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (canOpen()) dialog.open ? dialog.close() : open();
    }
  });
  return {
    dialog,
    open,
    openerFor: (link) => (dialog.contains(link) ? previousFocus : link),
    closeForNavigation() {
      navigating = true;
      dialog.close();
    },
  };
}
