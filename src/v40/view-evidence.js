import React from "react";
import designSystem from "./design-system.js";

export function evidenceValues(s) {
  const eveColors = {
    d: "var(--text-dim)",
    ok: "var(--green)",
    r: "var(--cyan)",
    warn: "var(--amber)",
    er: "var(--red)",
    lore: "var(--purple)",
    cmd: "var(--text)",
    alert: "var(--red)",
  };
  const eveLog = s.eveLog.map(([k, t]) => ({
    text: k === "cmd" ? `doug@zeus:~$ ${t}` : k === "d" ? `· ${t}` : t,
    style: `white-space:pre-wrap;word-break:break-word;color:${eveColors[k]};${k === "cmd" ? "margin-top:8px;color:var(--green)" : ""}${k === "lore" ? "text-shadow:0 0 10px var(--purple-glow)" : ""}${k === "alert" ? "font-weight:700;text-shadow:0 0 12px var(--red-glow)" : ""}`,
  }));
  const eveChips = ["fleet", "hosts", "backups", "atlas", "routes", "cost", "surprise me ✦"].map((label) => ({
    label,
    run: () => this.eve(label.replace(" ✦", "")),
  }));
  const Tag = designSystem.Tag;
  const selectedTag = Tag ? React.createElement(Tag, { color: "cyan" }, "SELECTED") : null;
  const energized = s.sig === "energized";
  return { eveLog, eveChips, selectedTag, energized };
}
