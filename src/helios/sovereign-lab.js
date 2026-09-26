import { $, $$, press } from "./dom.js";
import { gsap } from "gsap";
import { computeWorldOutcome } from "../odyssey/sovereign-model";

export function setupSovereignLab({ scenes, motion, copy }) {
  const w = { arch: "hybrid", sens: "mixed", net: true, permit: false };
  let lastWorld = null;
  function world(arch, sens, net, permit) {
    const r = computeWorldOutcome({
      architecture: arch,
      sensitivity: sens,
      connected: net,
      allowPrivateEgress: permit,
    });
    return { ...r, data: r.dataHandling, netd: r.internetDependency };
  }
  function renderWorld() {
    const r = world(w.arch, w.sens, w.net, w.permit);
    const settings = JSON.stringify(w);
    const preset = Object.entries(MISSIONS).find(([, values]) =>
      Object.keys(values).every((key) => values[key] === w[key]),
    );
    $$("[data-mission]").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mission === preset?.[0])),
    );
    $("#mission-state").textContent = preset
      ? `${$("[data-mission=" + preset[0] + "] strong").textContent} · selected`
      : "Custom flight plan · your settings";
    if (lastWorld && lastWorld.settings !== settings) {
      const changes = ["local", "cloud", "held"].filter((key) => lastWorld[key] !== r[key]);
      $("#w-change").textContent = changes.length
        ? changes.map((key) => `${key[0].toUpperCase() + key.slice(1)}: ${lastWorld[key]} → ${r[key]}`).join(" · ")
        : "Settings changed; the request counts stay the same.";
      const feedback = $("#decision-change");
      feedback.dataset.held = String(r.held > 0);
      const rect = feedback.getBoundingClientRect();
      if (motion() && rect.bottom > 0 && rect.top < innerHeight)
        gsap.fromTo(feedback, { y: 5 }, { y: 0, duration: 0.35, ease: "power2.out", overwrite: true });
    }
    lastWorld = { settings, local: r.local, cloud: r.cloud, held: r.held };
    const set = (id, v) => {
      $(id).textContent = v;
    };
    set("#n-local", r.local);
    set("#n-cloud", r.cloud);
    set("#n-held", r.held);
    set("#w-summary", r.summary);
    set("#w-data", r.data);
    set("#w-net", r.netd);
    set("#net-label", w.net ? "Connected" : "Offline");
    $("#relay-chip").textContent = w.net ? "CLOUD RELAY CONNECTED" : "CLOUD RELAY OFFLINE";
    $("#relay-chip").style.color = w.net ? "var(--gold)" : "var(--heldtext)";
    const sc = { "#b-local": r.local / 12, "#b-cloud": r.cloud / 12, "#b-held": r.held / 12 };
    Object.entries(sc).forEach(([id, v]) => {
      const el = $(id);
      if (motion() && scenes.flowVisible())
        gsap.to(el, { scaleX: v, duration: 0.7, ease: "expo.out", overwrite: true });
      else el.style.transform = `scaleX(${v})`;
    });
    scenes.renderFlow(r, w);
    $("#cmp-rows").innerHTML = ["sovereign", "hybrid", "cloud"]
      .map((a) => {
        const x = world(a, w.sens, w.net, w.permit);
        const nm = a === "sovereign" ? "Sovereign / local" : a === "hybrid" ? "Hybrid" : "Cloud";
        return `<div class="cmp${a === w.arch ? " on" : ""}"><strong>${nm}</strong><span>${x.local}</span><span>${x.cloud}</span><span>${x.held}</span></div>`;
      })
      .join("");
  }
  $("#arch-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-arch]");
    if (!b) return;
    w.arch = b.dataset.arch;
    press($("#arch-group"), "data-arch", w.arch);
    renderWorld();
  });
  $("#sens-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sens]");
    if (!b) return;
    w.sens = b.dataset.sens;
    press($("#sens-group"), "data-sens", w.sens);
    renderWorld();
  });
  $("#tg-net").addEventListener("click", (e) => {
    w.net = !w.net;
    e.currentTarget.setAttribute("aria-pressed", w.net);
    renderWorld();
  });
  $("#tg-permit").addEventListener("click", (e) => {
    w.permit = !w.permit;
    e.currentTarget.setAttribute("aria-pressed", w.permit);
    renderWorld();
  });
  const MISSIONS = {
    routine: { arch: "hybrid", sens: "mixed", net: true, permit: false },
    blackout: { arch: "hybrid", sens: "mixed", net: false, permit: false },
    classified: { arch: "cloud", sens: "private", net: true, permit: false },
  };
  $("#missions").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mission]");
    if (!b) return;
    Object.assign(w, MISSIONS[b.dataset.mission]);
    press($("#arch-group"), "data-arch", w.arch);
    press($("#sens-group"), "data-sens", w.sens);
    $("#tg-net").setAttribute("aria-pressed", w.net);
    $("#tg-permit").setAttribute("aria-pressed", w.permit);
    renderWorld();
  });
  $("#copy-mission").addEventListener("click", () =>
    copy(
      `${location.origin}${location.pathname}#mission=${w.arch}.${w.sens}.${w.net ? "connected" : "offline"}.${w.permit ? "permitted" : "held"}`,
      "Mission link copied",
    ),
  );
  renderWorld();
  return {
    render: renderWorld,
    getState: () => ({ ...w }),
    setMission(next) {
      Object.assign(w, next);
      press($("#arch-group"), "data-arch", w.arch);
      press($("#sens-group"), "data-sens", w.sens);
      $("#tg-net").setAttribute("aria-pressed", w.net);
      $("#tg-permit").setAttribute("aria-pressed", w.permit);
      renderWorld();
    },
  };
}
