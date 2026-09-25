/**
 * Principles, Studios and Flight heritage open as their own pages inside the one document,
 * so the home page stays short and every instrument keeps its behavior.
 * The entry script sets html[data-room] before paint when a room is the first address.
 */
export function setupRooms() {
  const root = document.documentElement;
  const crumb = document.getElementById("room-crumb");
  const links = [...document.querySelectorAll(".room-links a")];
  const homeTitle = document.title;
  let current = null;

  const roomOf = (hash) => {
    if (!/^#[\w-]+$/.test(hash)) return null;
    return document.getElementById(hash.slice(1))?.closest("section.room") || null;
  };

  function show(room) {
    if (room === current && (room ? root.dataset.room === room.id : !root.dataset.room)) return false;
    current = room;
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

  return {
    /** Shows the room that holds this address, or the home page. Returns true when the page changed. */
    sync: (hash) => show(roomOf(hash)),
  };
}
