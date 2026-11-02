import { snapshot } from "./evidence.ts";

import { destinationLabel } from "./destinations.ts";


import { thumbnailSources } from "./page-assets.ts";
export function openingValues() {
  const s = this.state,
    tech = this.props.techDetail ?? false;
  const pad = 0;
  const railDefs = [
    ["top", "Home"],
    ["rooms", "Worlds"],
    ["films", "Films"],
    ["workshop", "Projects"],
    ["studies", "Experiments"],
    ["evidence", "Evidence"],
    ["contact", "Contact"],
  ];
  const activeRail = s.active === "law" || s.active === "work" ? "studies" : s.active;
  const railItems = railDefs.map(([id]) => ({
    href: "#" + id,
    label: destinationLabel(id),
    style: `display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 6px;border-radius:10px;color:${activeRail === id ? "var(--accent)" : "var(--text-dim)"};background:${activeRail === id ? "rgba(255,149,0,.08)" : "transparent"};transition:all .45s cubic-bezier(.23,1,.32,1)`,
  }));
  const telemetry = [
    [String(snapshot.cluster.hostsOnline), snapshot.cluster.hostsOnline, "Hosts at probe", "var(--cyan)"],
    [String(snapshot.containers.running), snapshot.containers.running, "Containers running", "var(--cyan)"],
    [String(snapshot.virtualMachines.running), snapshot.virtualMachines.running, "Virtual machine", "var(--cyan)"],
    [
      String(snapshot.backup.latestVerified),
      snapshot.backup.latestVerified,
      "Latest backup checks passed",
      "var(--green)",
    ],
  ].map(([value, count, label, color]) => ({ value, count, label, color }));
  const enter = (e) => this.hoverIn(e),
    leave = (e) => this.hoverOut(e);
  const worlds = [
    {
      index: "01",
      name: "Starship lab",
      line: "Your ship. Your intelligence.",
      desc: "Trace twelve requests. Cut the cloud link. Compare three designs.",
      color: "var(--cyan)",
      href: "/rooms/starship/interactive/",
      img: this.res("public/v38/assets/room-starship.webp"),
      video: "/assets/zenith/starship-flyby.mp4",
      hasVideo: true,
    },
    {
      index: "02",
      name: "Principles engine",
      line: "Put the principles in motion.",
      desc: "Turn an instrument. See the decision behind the rule.",
      color: "var(--accent)",
      href: "/rooms/principles/interactive/",
      img: this.res("public/v38/assets/room-principles.webp"),
      video: "/assets/zenith/orbital-instrument.mp4",
      hasVideo: true,
    },
    {
      index: "03",
      name: "The Studios",
      line: "A world worth getting lost in.",
      desc: "Explore light, signatures and short films.",
      color: "var(--purple)",
      href: "/rooms/studios/interactive/",
      img: this.res("public/v38/assets/room-studios-threshold.webp"),
      video: "/assets/zenith/threshold.mp4",
      hasVideo: true,
    },
    {
      index: "04",
      name: "Flight heritage",
      line: "Built with a test pilot’s mind.",
      desc: "Four aviation pioneers. Four lessons for the workshop.",
      color: "var(--amber)",
      href: "/rooms/heritage/interactive/",
      img: this.res("public/v38/assets/room-heritage.webp"),
      video: "",
      hasVideo: false,
    },
  ].map((w) => ({
    ...w,
    enter,
    leave,
    srcSet: thumbnailSources(w.img),
    alt: {
      "01": "A starship at rest above the blue evening workshop",
      "02": "A brass instrument with glowing orbital rings",
      "03": "A golden doorway opening toward a distant ringed world",
      "04": "Aviation drawings and instruments arranged on a workbench",
    }[w.index],
  }));
  const F = this.filmById(s.film);
  const collections = this.collections.map((label, i) => ({
    label,
    pick: () => this.setState({ coll: i }),
    style: `padding:8px 14px;border-radius:999px;cursor:pointer;font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;transition:all .3s;border:1px solid ${s.coll === i ? "var(--purple)" : "var(--glass-border)"};background:${s.coll === i ? "rgba(204,0,255,.12)" : "var(--glass)"};color:${s.coll === i ? "var(--text)" : "var(--text-dim)"};box-shadow:${s.coll === i ? "0 0 18px var(--purple-glow)" : "none"}`,
  }));
  const filmList = this.films
    .filter((f) => f[0] === s.coll)
    .map((f) => {
      const on = f[1] === s.film;
      return {
        title: f[2],
        alt: f[3],
        srcSet: thumbnailSources(this.res(`public/assets/zenith/${f[1]}-poster.webp`)),
        poster: this.res(`public/assets/zenith/${f[1]}-poster.webp`),
        src: `/assets/zenith/${f[1]}.mp4`,
        active: on,
        pressed: String(on),
        enter,
        leave,
        pick: () => this.setState({ film: f[1] }),
        style: `position:relative;display:block;aspect-ratio:16/9;border-radius:12px;overflow:hidden;padding:0;cursor:pointer;background:#000;transition:all .4s cubic-bezier(.23,1,.32,1);border:1px solid ${on ? "var(--accent)" : "var(--glass-border)"};box-shadow:${on ? "0 0 24px var(--accent-glow)" : "var(--shadow-card)"}`,
      };
    });
  const C = s.cinema ? this.filmById(s.cinema) : null;
  return { s, tech, pad, railItems, telemetry, leave, worlds, F, collections, filmList, C };
}
