import React from "react";
const h = React.createElement;
const classes = (...names) => names.filter(Boolean).join(" ");
function Button({ variant = "primary", size = "md", as = "button", glow: _glow, children, className, ...rest }) {
  return h(as, { ...rest, className: classes("za-btn", `za-btn--${variant}`, `za-btn--${size}`, className) }, children);
}
function Panel({ color = "accent", title, icon, tag, children, className, ...rest }) {
  return h(
    "section",
    { ...rest, className: classes("za-panel", `za-color-${color}`, className) },
    h("span", { className: "za-panel-rail", "aria-hidden": "true" }),
    title &&
      h(
        "div",
        { className: "za-panel-head" },
        icon && h("span", { className: "za-panel-icon", "aria-hidden": "true" }, icon),
        h("h3", { className: "za-panel-title" }, title),
        tag,
        h("span", { className: "za-panel-bar", "aria-hidden": "true" }),
      ),
    children,
  );
}
function StatusDot({ status = "on", size = 8, label, className, ...rest }) {
  const dot = h("span", {
    className: classes("za-dot", `za-dot--${status}`, `za-dot--${size}`),
    "aria-hidden": "true",
  });
  return h(
    "span",
    { ...rest, className: classes("za-status", className) },
    dot,
    label && h("span", { className: "za-micro" }, label),
  );
}
function Tag({ color = "cyan", children, className, ...rest }) {
  return h("span", { ...rest, className: classes("za-tag", `za-color-${color}`, className) }, children);
}
function StatCell({ value, label, sub, color = "cyan", className, ...rest }) {
  return h(
    "div",
    { ...rest, className: classes("za-statcell", `za-color-${color}`, className) },
    h("div", { className: "za-stat-value" }, value),
    h("div", { className: "za-stat-label" }, label),
    sub && h("div", { className: "za-stat-sub" }, sub),
  );
}
function Terminal({ title = "zeusapollo", hint, children, bodyHeight = 340, className, ...rest }) {
  return h(
    "div",
    { ...rest, className: classes("za-terminal", className) },
    h(
      "div",
      { className: "za-terminal-head" },
      ["red", "amber", "green"].map((color) =>
        h("span", { key: color, className: `za-terminal-light za-terminal-light--${color}`, "aria-hidden": "true" }),
      ),
      h("span", { className: "za-terminal-title" }, h("b", null, title)),
      hint && h("span", { className: "za-terminal-hint" }, hint),
    ),
    h("div", { className: classes("za-terminal-body", `za-terminal-body--${bodyHeight}`) }, children),
  );
}
function TerminalLine({ user = "doug", host = "zeus", children }) {
  return h(
    "div",
    { className: "za-terminal-line" },
    h(
      "span",
      { className: "za-terminal-prompt" },
      h("span", { className: "za-terminal-user" }, user, "@", host),
      ":~$ ",
    ),
    children,
  );
}
function Chip({ children, className, ...rest }) {
  return h("button", { ...rest, className: classes("za-chip", className) }, children);
}
function Input({ className, ...rest }) {
  return h("input", { ...rest, className: classes("za-input", className) });
}
export default { Button, Panel, StatusDot, Tag, StatCell, Terminal, TerminalLine, Chip, Input };
