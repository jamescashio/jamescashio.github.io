import React from "react";
type Surface = React.HTMLAttributes<HTMLElement> & { [attribute: string]: unknown };
const h = React.createElement;
const classes = (...names: Array<string | undefined | false>) => names.filter(Boolean).join(" ");
function Button({
  variant = "primary",
  size = "md",
  as = "button",
  glow: _glow,
  children,
  className,
  ...rest
}: Surface & { variant?: string; size?: string; as?: React.ElementType; glow?: boolean }) {
  return h(as, { ...rest, className: classes("za-btn", `za-btn--${variant}`, `za-btn--${size}`, className) }, children);
}
function Panel({
  color = "accent",
  title,
  icon,
  tag,
  children,
  className,
  ...rest
}: Surface & { color?: string; icon?: React.ReactNode; tag?: React.ReactNode }) {
  return h(
    "section",
    { ...rest, className: classes("za-panel", `za-color-${color}`, className) },
    h("span", { className: "za-panel-rail", "aria-hidden": "true" }),
    title &&
      h(
        "div",
        { className: "za-panel-head" },
        icon && h("span", { className: "za-panel-icon", "aria-hidden": "true" }, icon),
        h("h2", { className: "za-panel-title" }, title),
        tag,
        h("span", { className: "za-panel-bar", "aria-hidden": "true" }),
      ),
    children,
  );
}
function StatusDot({
  status = "on",
  size = 8,
  label,
  className,
  ...rest
}: Surface & { status?: string; size?: number; label?: React.ReactNode }) {
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
function Tag({ color = "cyan", children, className, ...rest }: Surface & { color?: string }) {
  return h("span", { ...rest, className: classes("za-tag", `za-color-${color}`, className) }, children);
}
function StatCell({
  value,
  label,
  sub,
  color = "cyan",
  className,
  ...rest
}: Surface & { value?: React.ReactNode; label?: React.ReactNode; sub?: React.ReactNode; color?: string }) {
  return h(
    "div",
    { ...rest, className: classes("za-statcell", `za-color-${color}`, className) },
    h("div", { className: "za-stat-value" }, value),
    h("div", { className: "za-stat-label" }, label),
    sub && h("div", { className: "za-stat-sub" }, sub),
  );
}
function Terminal({
  title = "zeusapollo",
  hint,
  children,
  bodyHeight = 340,
  className,
  ...rest
}: Surface & { hint?: React.ReactNode; bodyHeight?: number }) {
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
function TerminalLine({
  user = "doug",
  host = "zeus",
  children,
}: {
  user?: string;
  host?: string;
  children?: React.ReactNode;
}) {
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
function Chip({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return h("button", { ...rest, className: classes("za-chip", className) }, children);
}
function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return h("input", { ...rest, className: classes("za-input", className) });
}
export default { Button, Panel, StatusDot, Tag, StatCell, Terminal, TerminalLine, Chip, Input };
