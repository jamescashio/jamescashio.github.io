const loaders = {
  starship: () => import("./room-starship.js"),
  principles: () => import("./room-principles.js"),
  studios: () => import("./room-studios.js"),
  heritage: () => import("./room-heritage.js"),
};

/** One authored room becomes a static page at build time and an interactive island on demand. */
export function setupRooms(context) {
  const root = document.documentElement;
  let crumb = document.getElementById("room-crumb");
  const links = [...document.querySelectorAll(".room-links a")];
  const homeTitle = document.title;
  const pending = new Map();
  const controllers = new Map();
  let current = null;

  /**
   * The room section a hash opens, or null for a home page address.
   * @param {string} hash
   * @returns {HTMLElement | null}
   */
  function roomOf(hash) {
    if (hash === "#build-story" || hash.startsWith("#mission=")) return document.getElementById("starship");
    if (!/^#[\w-]+$/.test(hash)) return null;
    return /** @type {HTMLElement | null} */ (document.getElementById(hash.slice(1))?.closest("section.room")) || null;
  }

  // An open room's title is the page's only visible h1; on the home page it returns to a paragraph,
  // so the static document and the home page each keep one h1.
  function titleAs(tag) {
    if (crumb.localName === tag) return;
    const next = document.createElement(tag);
    next.id = crumb.id;
    next.className = crumb.className;
    crumb.replaceWith(next);
    crumb = next;
  }

  function show(room) {
    if (room === current && (room ? root.dataset.room === room.id : !root.dataset.room)) return false;
    current = room;
    titleAs(room ? "h1" : "p");
    if (room) {
      const title = room.dataset.roomTitle;
      root.dataset.room = room.id;
      crumb.textContent = `cAshIo / ${title}`;
      document.title = `${title} · cAshIo`;
    } else {
      delete root.dataset.room;
      crumb.textContent = "";
      document.title = homeTitle;
    }
    for (const link of links) {
      if (room && link.getAttribute("href") === `#${room.id}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    return true;
  }

  async function ensure(hash) {
    const room = roomOf(hash);
    if (!room || room.dataset.roomState === "ready") return true;
    if (pending.has(room.id)) return pending.get(room.id);
    const placeholder = room.firstElementChild;
    const status = placeholder.querySelector(".room-load-status");
    status.textContent = `Opening ${room.dataset.roomTitle}…`;
    room.dataset.roomState = "loading";
    room.setAttribute("aria-busy", "true");
    const loading = (async () => {
      try {
        const module = await loaders[room.id]();
        const template = document.createElement("template");
        // This is trusted, build-time authored HTML, never visitor or network-supplied text.
        template.innerHTML = module.html;
        const authored = template.content.querySelector("section.room");
        if (authored?.id !== room.id) throw new Error("Room content does not match its address");
        room.className = authored.className;
        room.replaceChildren(...authored.childNodes);
        const reading = document.createElement("a");
        reading.href = `/rooms/${room.id}/`;
        reading.textContent = "Reading edition";
        room.querySelector(".room-end")?.append(reading);
        context.scenes.attachRoom(room);
        controllers.set(room.id, module.mount?.(context));
        room.dataset.roomState = "ready";
        window.dispatchEvent(new CustomEvent("helios-room-ready", { detail: room }));
        return true;
      } catch {
        room.dataset.roomState = "error";
        status.textContent = "This room couldn’t load. Read its text and artwork below, or reload to try again.";
        const retry = document.createElement("button");
        retry.className = "btn";
        retry.textContent = "Reload this room";
        retry.addEventListener("click", () => location.reload());
        // Keep the heading, status and reading link even if mounting failed after replacing the placeholder.
        room.replaceChildren(placeholder);
        status.after(retry);
        return false;
      } finally {
        room.removeAttribute("aria-busy");
      }
    })();
    pending.set(room.id, loading);
    return loading;
  }

  return {
    sync: (hash) => show(roomOf(hash)),
    needsLoad: (hash) => {
      const room = roomOf(hash);
      return room && room.dataset.roomState !== "ready";
    },
    ensure,
    controller: (id) => controllers.get(id),
  };
}
