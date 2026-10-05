import React from "react";
/* @ds-bundle: {"format":3,"namespace":"ZeusApolloDesignSystem_ab791d","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"StatusDot","sourcePath":"components/core/StatusDot.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"StatCell","sourcePath":"components/data/StatCell.jsx"},{"name":"Terminal","sourcePath":"components/data/Terminal.jsx"},{"name":"TerminalLine","sourcePath":"components/data/Terminal.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/core/Button.jsx":"178772cb392d","components/core/Panel.jsx":"aec60ae9048d","components/core/StatusDot.jsx":"a6af32f5a357","components/core/Tag.jsx":"5ee8d5144818","components/data/StatCell.jsx":"489968983d78","components/data/Terminal.jsx":"f669e16f1e1b","components/forms/Chip.jsx":"e67620fdc916","components/forms/Input.jsx":"dd5f4969356f","ui_kits/command-center/components.jsx":"59e2bf5ae741","ui_kits/command-center/screens.jsx":"5bd0d4e2b8f5"},"inlinedExternals":[],"unexposedExports":[]} */

const designSystem = (() => {
  const __ds_ns = {};

  const __ds_scope = {};

  __ds_ns.__errors = __ds_ns.__errors || [];

  // components/core/Button.jsx
  try {
    (() => {
      const _extends = Object.assign;
      /**
       * LCARS action button. Orbitron, wide tracking, neon glow on the primary.
       */
      function Button({ variant = "primary", size = "md", as = "button", glow: _glow, children, style, ...rest }) {
        const sizes = {
          sm: {
            padding: "8px 16px",
            fontSize: "11px",
          },
          md: {
            padding: "14px 26px",
            fontSize: "13px",
          },
          lg: {
            padding: "16px 34px",
            fontSize: "15px",
          },
        };
        const base = {
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: ".1em",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          transition: "all var(--dur) var(--ease)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass)",
          color: "var(--text)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          textDecoration: "none",
          lineHeight: 1,
          ...sizes[size],
        };
        const variants = {
          primary: {
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--on-accent)",
            border: "none",
            boxShadow: "0 0 24px var(--accent-glow)",
          },
          secondary: {
            background: "var(--glass)",
            color: "var(--text)",
            backdropFilter: "blur(6px)",
          },
          ghost: {
            background: "transparent",
            color: "var(--text-dim)",
          },
          danger: {
            background: "transparent",
            color: "var(--red)",
            borderColor: "var(--red)",
          },
          engage: {
            background: "transparent",
            color: "var(--green)",
            borderColor: "var(--green)",
          },
        };
        const Comp = as;
        return /*#__PURE__*/ React.createElement(
          Comp,
          _extends(
            {
              className: `za-btn za-btn--${variant}`,
              style: {
                ...base,
                ...variants[variant],
                ...style,
              },
            },
            rest,
          ),
          children,
        );
      }
      Object.assign(__ds_scope, { Button });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) });
  }

  // components/core/Panel.jsx
  try {
    (() => {
      const _extends = Object.assign;
      const RAIL = {
        accent: "linear-gradient(180deg, var(--accent), var(--purple))",
        cyan: "linear-gradient(180deg, var(--cyan), var(--green))",
        green: "linear-gradient(180deg, var(--green), var(--cyan))",
        amber: "linear-gradient(180deg, var(--amber), var(--accent))",
        purple: "linear-gradient(180deg, var(--purple), var(--cyan))",
        red: "linear-gradient(180deg, var(--red), var(--amber))",
      };
      const HEAD_COLOR = {
        accent: "var(--accent)",
        cyan: "var(--cyan)",
        green: "var(--green)",
        amber: "var(--amber)",
        purple: "var(--purple)",
        red: "var(--red)",
      };

      /**
       * The signature LCARS panel: a glass surface with a colored rail down the
       * left edge, an Orbitron section head, optional tag, and a tapering bar.
       */
      function Panel({ color = "accent", title, icon, tag, children, style, ...rest }) {
        const panel = {
          position: "relative",
          background: "linear-gradient(158deg, rgba(22,22,40,.74), var(--surface) 62%)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "26px 26px 28px",
          overflow: "hidden",
          backdropFilter: "var(--blur-glass)",
          boxShadow: "var(--shadow-panel)",
          ...style,
        };
        const rail = {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "var(--accent-rail)",
          background: RAIL[color],
        };
        const head = {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: title ? "18px" : 0,
          flexWrap: "wrap",
        };
        const h2 = {
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-h2)",
          fontWeight: 700,
          letterSpacing: ".06em",
          color: "var(--text)",
        };
        const iconBox = {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "30px",
          height: "30px",
          borderRadius: "9px",
          flex: "0 0 auto",
          background: "var(--glass)",
          border: `1px solid ${HEAD_COLOR[color]}`,
          boxShadow: `inset 0 0 14px ${HEAD_COLOR[color]}22, 0 0 16px -6px ${HEAD_COLOR[color]}`,
          fontSize: "15px",
        };
        const bar = {
          height: "5px",
          borderRadius: "5px",
          flex: 1,
          minWidth: "40px",
          background: `linear-gradient(90deg, ${HEAD_COLOR[color]}, transparent)`,
        };
        return /*#__PURE__*/ React.createElement(
          "section",
          _extends(
            {
              className: "za-panel",
              style: panel,
            },
            rest,
          ),
          /*#__PURE__*/ React.createElement("span", {
            "aria-hidden": "true",
            style: rail,
          }),
          title &&
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: head,
              },
              icon &&
                /*#__PURE__*/ React.createElement(
                  "span",
                  {
                    "aria-hidden": "true",
                    style: iconBox,
                  },
                  icon,
                ),
              /*#__PURE__*/ React.createElement(
                "h2",
                {
                  style: h2,
                },
                title,
              ),
              tag,
              /*#__PURE__*/ React.createElement("span", {
                "aria-hidden": "true",
                style: bar,
              }),
            ),
          children,
        );
      }
      Object.assign(__ds_scope, { Panel });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) });
  }

  // components/core/StatusDot.jsx
  try {
    (() => {
      const _extends = Object.assign;
      const C = {
        on: "var(--green)",
        deg: "var(--amber)",
        emr: "var(--red)",
        off: "var(--text-dim)",
      };

      /**
       * Glowing status dot — fleet/node health indicator. Pair with a mono label.
       */
      function StatusDot({ status = "on", size = 8, label, style, ...rest }) {
        const c = C[status] || status;
        const dot = {
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "50%",
          background: c,
          boxShadow: status === "off" ? "none" : `0 0 8px ${c}`,
          verticalAlign: "middle",
          flex: "0 0 auto",
        };
        if (!label)
          return /*#__PURE__*/ React.createElement(
            "span",
            _extends(
              {
                style: {
                  ...dot,
                  ...style,
                },
              },
              rest,
            ),
          );
        return /*#__PURE__*/ React.createElement(
          "span",
          _extends(
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                ...style,
              },
            },
            rest,
          ),
          /*#__PURE__*/ React.createElement("span", {
            style: dot,
          }),
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-micro)",
                letterSpacing: ".1em",
                color: "var(--text-dim)",
              },
            },
            label,
          ),
        );
      }
      Object.assign(__ds_scope, { StatusDot });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/core/StatusDot.jsx", error: String((e && e.message) || e) });
  }

  // components/core/Tag.jsx
  try {
    (() => {
      const _extends = Object.assign;
      const C = {
        green: "var(--green)",
        cyan: "var(--cyan)",
        amber: "var(--amber)",
        red: "var(--red)",
        purple: "var(--purple)",
        accent: "var(--accent)",
        dim: "var(--text-dim)",
      };

      /**
       * Mono status pill — outlined capsule used for NEW / LIVE / UPD labels and
       * fleet status. Border + text inherit the chosen color; faint glow.
       */
      function Tag({ color = "cyan", children, style, ...rest }) {
        const c = C[color] || color;
        return /*#__PURE__*/ React.createElement(
          "span",
          _extends(
            {
              className: "za-tag",
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-micro)",
                letterSpacing: ".12em",
                padding: "3px 9px",
                borderRadius: "var(--radius-pill)",
                border: `1px solid ${c}`,
                color: c,
                background: "rgba(255,255,255,.05)",
                boxShadow: `0 0 14px -5px ${c}`,
                display: "inline-block",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                ...style,
              },
            },
            rest,
          ),
          children,
        );
      }
      Object.assign(__ds_scope, { Tag });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) });
  }

  // components/data/StatCell.jsx
  try {
    (() => {
      const _extends = Object.assign;
      const COLORS = {
        cyan: "var(--cyan)",
        cyanGlow: "var(--cyan-glow)",
        green: "var(--green)",
        greenGlow: "var(--green-glow)",
        accent: "var(--accent)",
        accentGlow: "var(--accent-glow)",
        amber: "var(--amber)",
        amberGlow: "var(--amber-glow)",
      };

      /**
       * Big-number stat cell — the "ribbon" unit. Orbitron numeral over a mono
       * label, on a glass card that lifts on hover.
       */
      function StatCell({ value, label, sub, color = "cyan", style, ...rest }) {
        const c = COLORS[color] || "var(--cyan)";
        const glow = COLORS[color + "Glow"] || "var(--cyan-glow)";
        return /*#__PURE__*/ React.createElement(
          "div",
          _extends(
            {
              className: "za-statcell",
              style: {
                background: "var(--surface-2)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "16px 12px",
                textAlign: "center",
                backdropFilter: "blur(8px)",
                ...style,
              },
            },
            rest,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(22px, 4vw, 34px)",
                color: c,
                textShadow: `0 0 18px ${glow}`,
                lineHeight: 1,
              },
            },
            value,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-micro)",
                letterSpacing: ".14em",
                color: "var(--text-dim)",
                marginTop: "6px",
                textTransform: "uppercase",
              },
            },
            label,
          ),
          sub &&
            /*#__PURE__*/ React.createElement(
              "div",
              {
                style: {
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  opacity: 0.85,
                  marginTop: "2px",
                },
              },
              sub,
            ),
        );
      }
      Object.assign(__ds_scope, { StatCell });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/data/StatCell.jsx", error: String((e && e.message) || e) });
  }

  // components/data/Terminal.jsx
  try {
    (() => {
      const _extends = Object.assign;
      /**
       * Terminal window — traffic-light bar + dark monospace body. The brand's
       * signature interactive surface. Children render as terminal output.
       */
      function Terminal({ title = "zeusapollo", hint, children, bodyHeight = 340, style, ...rest }) {
        return /*#__PURE__*/ React.createElement(
          "div",
          _extends(
            {
              style: {
                background: "var(--void-deep)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                boxShadow: "var(--shadow-terminal)",
                fontFamily: "var(--font-mono)",
                ...style,
              },
            },
            rest,
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "linear-gradient(180deg, #11141d, #0a0c12)",
                borderBottom: "1px solid var(--glass-border)",
              },
            },
            /*#__PURE__*/ React.createElement("span", {
              style: {
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#ff5f56",
              },
            }),
            /*#__PURE__*/ React.createElement("span", {
              style: {
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#ffbd2e",
              },
            }),
            /*#__PURE__*/ React.createElement("span", {
              style: {
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#27c93f",
              },
            }),
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  fontSize: "11px",
                  letterSpacing: ".1em",
                  color: "var(--text-dim)",
                  marginLeft: "6px",
                },
              },
              /*#__PURE__*/ React.createElement(
                "b",
                {
                  style: {
                    color: "var(--cyan)",
                  },
                },
                title,
              ),
            ),
            hint &&
              /*#__PURE__*/ React.createElement(
                "span",
                {
                  style: {
                    marginLeft: "auto",
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    letterSpacing: ".06em",
                  },
                },
                hint,
              ),
          ),
          /*#__PURE__*/ React.createElement(
            "div",
            {
              style: {
                padding: "14px 16px",
                height: bodyHeight,
                overflowY: "auto",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text)",
              },
            },
            children,
          ),
        );
      }

      /** A prompt line for use inside <Terminal>. */
      function TerminalLine({ user = "doug", host = "zeus", children }) {
        return /*#__PURE__*/ React.createElement(
          "div",
          {
            style: {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            },
          },
          /*#__PURE__*/ React.createElement(
            "span",
            {
              style: {
                color: "var(--green)",
              },
            },
            /*#__PURE__*/ React.createElement(
              "span",
              {
                style: {
                  color: "var(--cyan)",
                },
              },
              user,
              "@",
              host,
            ),
            ":~$ ",
          ),
          children,
        );
      }
      Object.assign(__ds_scope, { Terminal, TerminalLine });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/data/Terminal.jsx", error: String((e && e.message) || e) });
  }

  // components/forms/Chip.jsx
  try {
    (() => {
      const _extends = Object.assign;
      /**
       * Command chip — small mono pill used as a quick-action / suggestion under
       * terminals and forms. Cyan glow on hover.
       */
      function Chip({ children, style, ...rest }) {
        return /*#__PURE__*/ React.createElement(
          "button",
          _extends(
            {
              className: "za-chip",
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: ".04em",
                color: "var(--text-dim)",
                background: "var(--glass)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                cursor: "pointer",
                ...style,
              },
            },
            rest,
          ),
          children,
        );
      }
      Object.assign(__ds_scope, { Chip });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) });
  }

  // components/forms/Input.jsx
  try {
    (() => {
      const _extends = Object.assign;
      /**
       * Text input — dark glass field with a cyan focus glow. Mono caret.
       */
      function Input({ style, ...rest }) {
        return /*#__PURE__*/ React.createElement(
          "input",
          _extends(
            {
              className: "za-input",
              style: {
                width: "100%",
                background: "var(--void-deep)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "11px 14px",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                caretColor: "var(--cyan)",
                transition: "all var(--dur) var(--ease)",
                ...style,
              },
            },
            rest,
          ),
        );
      }
      Object.assign(__ds_scope, { Input });
    })();
  } catch (e) {
    __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) });
  }

  return __ds_scope;
})();
export default designSystem;
