/* @ds-bundle: {"format":3,"namespace":"ZeusApolloDesignSystem_ab791d","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"StatusDot","sourcePath":"components/core/StatusDot.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"StatCell","sourcePath":"components/data/StatCell.jsx"},{"name":"Terminal","sourcePath":"components/data/Terminal.jsx"},{"name":"TerminalLine","sourcePath":"components/data/Terminal.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/core/Button.jsx":"178772cb392d","components/core/Panel.jsx":"aec60ae9048d","components/core/StatusDot.jsx":"a6af32f5a357","components/core/Tag.jsx":"5ee8d5144818","components/data/StatCell.jsx":"489968983d78","components/data/Terminal.jsx":"f669e16f1e1b","components/forms/Chip.jsx":"e67620fdc916","components/forms/Input.jsx":"dd5f4969356f","ui_kits/command-center/components.jsx":"59e2bf5ae741","ui_kits/command-center/screens.jsx":"5bd0d4e2b8f5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ZeusApolloDesignSystem_ab791d = window.ZeusApolloDesignSystem_ab791d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * LCARS action button. Orbitron, wide tracking, neon glow on the primary.
 */
function Button({
  variant = 'primary',
  size = 'md',
  as = 'button',
  glow,
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: '11px'
    },
    md: {
      padding: '14px 26px',
      fontSize: '13px'
    },
    lg: {
      padding: '16px 34px',
      fontSize: '15px'
    }
  };
  const base = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '.1em',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all var(--dur) var(--ease)',
    border: '1px solid var(--glass-border)',
    background: 'var(--glass)',
    color: 'var(--text)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
    lineHeight: 1,
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
      color: 'var(--on-accent)',
      border: 'none',
      boxShadow: '0 0 24px var(--accent-glow)'
    },
    secondary: {
      background: 'var(--glass)',
      color: 'var(--text)',
      backdropFilter: 'blur(6px)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-dim)'
    },
    danger: {
      background: 'transparent',
      color: 'var(--red)',
      borderColor: 'var(--red)'
    },
    engage: {
      background: 'transparent',
      color: 'var(--green)',
      borderColor: 'var(--green)'
    }
  };
  const Comp = as;
  return /*#__PURE__*/React.createElement(Comp, _extends({
    className: `za-btn za-btn--${variant}`,
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RAIL = {
  accent: 'linear-gradient(180deg, var(--accent), var(--purple))',
  cyan: 'linear-gradient(180deg, var(--cyan), var(--green))',
  green: 'linear-gradient(180deg, var(--green), var(--cyan))',
  amber: 'linear-gradient(180deg, var(--amber), var(--accent))',
  purple: 'linear-gradient(180deg, var(--purple), var(--cyan))',
  red: 'linear-gradient(180deg, var(--red), var(--amber))'
};
const HEAD_COLOR = {
  accent: 'var(--accent)',
  cyan: 'var(--cyan)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  purple: 'var(--purple)',
  red: 'var(--red)'
};

/**
 * The signature LCARS panel: a glass surface with a colored rail down the
 * left edge, an Orbitron section head, optional tag, and a tapering bar.
 */
function Panel({
  color = 'accent',
  title,
  icon,
  tag,
  children,
  style,
  ...rest
}) {
  const panel = {
    position: 'relative',
    background: 'linear-gradient(158deg, rgba(22,22,40,.74), var(--surface) 62%)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '26px 26px 28px',
    overflow: 'hidden',
    backdropFilter: 'var(--blur-glass)',
    boxShadow: 'var(--shadow-panel)',
    ...style
  };
  const rail = {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 'var(--accent-rail)',
    background: RAIL[color]
  };
  const head = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: title ? '18px' : 0,
    flexWrap: 'wrap'
  };
  const h2 = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--fs-h2)',
    fontWeight: 700,
    letterSpacing: '.06em',
    color: 'var(--text)'
  };
  const iconBox = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    flex: '0 0 auto',
    background: 'var(--glass)',
    border: `1px solid ${HEAD_COLOR[color]}`,
    boxShadow: `inset 0 0 14px ${HEAD_COLOR[color]}22, 0 0 16px -6px ${HEAD_COLOR[color]}`,
    fontSize: '15px'
  };
  const bar = {
    height: '5px',
    borderRadius: '5px',
    flex: 1,
    minWidth: '40px',
    background: `linear-gradient(90deg, ${HEAD_COLOR[color]}, transparent)`
  };
  return /*#__PURE__*/React.createElement("section", _extends({
    className: "za-panel",
    style: panel
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: rail
  }), title && /*#__PURE__*/React.createElement("div", {
    style: head
  }, icon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: iconBox
  }, icon), /*#__PURE__*/React.createElement("h2", {
    style: h2
  }, title), tag, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: bar
  })), children);
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  on: 'var(--green)',
  deg: 'var(--amber)',
  emr: 'var(--red)',
  off: 'var(--text-dim)'
};

/**
 * Glowing status dot — fleet/node health indicator. Pair with a mono label.
 */
function StatusDot({
  status = 'on',
  size = 8,
  label,
  style,
  ...rest
}) {
  const c = C[status] || status;
  const dot = {
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    background: c,
    boxShadow: status === 'off' ? 'none' : `0 0 8px ${c}`,
    verticalAlign: 'middle',
    flex: '0 0 auto'
  };
  if (!label) return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      ...dot,
      ...style
    }
  }, rest));
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: dot
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-micro)',
      letterSpacing: '.1em',
      color: 'var(--text-dim)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  green: 'var(--green)',
  cyan: 'var(--cyan)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  purple: 'var(--purple)',
  accent: 'var(--accent)',
  dim: 'var(--text-dim)'
};

/**
 * Mono status pill — outlined capsule used for NEW / LIVE / UPD labels and
 * fleet status. Border + text inherit the chosen color; faint glow.
 */
function Tag({
  color = 'cyan',
  children,
  style,
  ...rest
}) {
  const c = C[color] || color;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "za-tag",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-micro)',
      letterSpacing: '.12em',
      padding: '3px 9px',
      borderRadius: 'var(--radius-pill)',
      border: `1px solid ${c}`,
      color: c,
      background: 'rgba(255,255,255,.05)',
      boxShadow: `0 0 14px -5px ${c}`,
      display: 'inline-block',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const COLORS = {
  cyan: 'var(--cyan)',
  cyanGlow: 'var(--cyan-glow)',
  green: 'var(--green)',
  greenGlow: 'var(--green-glow)',
  accent: 'var(--accent)',
  accentGlow: 'var(--accent-glow)',
  amber: 'var(--amber)',
  amberGlow: 'var(--amber-glow)'
};

/**
 * Big-number stat cell — the "ribbon" unit. Orbitron numeral over a mono
 * label, on a glass card that lifts on hover.
 */
function StatCell({
  value,
  label,
  sub,
  color = 'cyan',
  style,
  ...rest
}) {
  const c = COLORS[color] || 'var(--cyan)';
  const glow = COLORS[color + 'Glow'] || 'var(--cyan-glow)';
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "za-statcell",
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '16px 12px',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 'clamp(22px, 4vw, 34px)',
      color: c,
      textShadow: `0 0 18px ${glow}`,
      lineHeight: 1
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-micro)',
      letterSpacing: '.14em',
      color: 'var(--text-dim)',
      marginTop: '6px',
      textTransform: 'uppercase'
    }
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-dim)',
      opacity: .85,
      marginTop: '2px'
    }
  }, sub));
}
Object.assign(__ds_scope, { StatCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCell.jsx", error: String((e && e.message) || e) }); }

// components/data/Terminal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Terminal window — traffic-light bar + dark monospace body. The brand's
 * signature interactive surface. Children render as terminal output.
 */
function Terminal({
  title = 'zeusapollo',
  hint,
  children,
  bodyHeight = 340,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--void-deep)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-terminal)',
      fontFamily: 'var(--font-mono)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: 'linear-gradient(180deg, #11141d, #0a0c12)',
      borderBottom: '1px solid var(--glass-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#ff5f56'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#ffbd2e'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#27c93f'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      letterSpacing: '.1em',
      color: 'var(--text-dim)',
      marginLeft: '6px'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--cyan)'
    }
  }, title)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: '10px',
      color: 'var(--text-dim)',
      letterSpacing: '.06em'
    }
  }, hint)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px',
      height: bodyHeight,
      overflowY: 'auto',
      fontSize: '13px',
      lineHeight: 1.6,
      color: 'var(--text)'
    }
  }, children));
}

/** A prompt line for use inside <Terminal>. */
function TerminalLine({
  user = 'doug',
  host = 'zeus',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cyan)'
    }
  }, user, "@", host), ":~$ "), children);
}
Object.assign(__ds_scope, { Terminal, TerminalLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Terminal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Command chip — small mono pill used as a quick-action / suggestion under
 * terminals and forms. Cyan glow on hover.
 */
function Chip({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: "za-chip",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '.04em',
      color: 'var(--text-dim)',
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '4px 10px',
      cursor: 'pointer',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input — dark glass field with a cyan focus glow. Mono caret.
 */
function Input({
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: "za-input",
    style: {
      width: '100%',
      background: 'var(--void-deep)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '11px 14px',
      color: 'var(--text)',
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      caretColor: 'var(--cyan)',
      transition: 'all var(--dur) var(--ease)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// ui_kits/command-center/components.jsx
try { (() => {
/* ZeusApollo Command Center — UI kit screen components.
   Self-contained (token-styled) recreations of the cashio.us command deck.
   Exported to window for the inline app script. */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ---------------- HUD ---------------- */
function Hud({
  alert,
  onAlert,
  onWarp
}) {
  const stat = (k, v, warp) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.15,
      minWidth: 60
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '.18em',
      color: 'var(--text-dim)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      color: warp ? 'var(--green)' : 'var(--cyan)',
      textShadow: `0 0 10px ${warp ? 'var(--green-glow)' : 'var(--cyan-glow)'}`
    }
  }, v));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'linear-gradient(180deg, rgba(10,10,18,.96), rgba(10,10,18,.80))',
      backdropFilter: 'var(--blur-hud)',
      borderBottom: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-hud)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--wrap-max)',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '8px 22px',
      flexWrap: 'wrap'
    }
  }, stat('FLEET', '19/19'), stat('BURN', '$0.35/d', true), stat('UPTIME', '99.98%'), stat('MODELS', '5'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "za-btn za-btn--engage",
    onClick: onWarp,
    style: hudBtn('var(--green)')
  }, "WARP"), /*#__PURE__*/React.createElement("button", {
    className: "za-btn za-btn--danger",
    onClick: onAlert,
    style: hudBtn(alert ? 'var(--red)' : 'var(--glass-border)', alert ? 'var(--red)' : 'var(--text)')
  }, alert ? 'STAND DOWN' : 'RED ALERT')));
}
function hudBtn(border, color) {
  return {
    fontFamily: 'var(--font-display)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.12em',
    padding: '7px 14px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    background: 'var(--glass)',
    border: `1px solid ${border}`,
    color: color || 'var(--text)'
  };
}

/* ---------------- Hero ---------------- */
function Hero() {
  const lines = ['SOVEREIGN INFRASTRUCTURE · ', 'MULTI-MODEL ORCHESTRATION · ', 'AUTONOMOUS OPS · '];
  const [txt, setTxt] = useState('');
  useEffect(() => {
    let i = 0,
      j = 0,
      cur = '',
      del = false,
      t;
    const tick = () => {
      const w = lines[i % lines.length];
      cur = del ? w.slice(0, j--) : w.slice(0, j++);
      setTxt(cur);
      if (!del && j > w.length) {
        del = true;
        t = setTimeout(tick, 1400);
        return;
      }
      if (del && j < 0) {
        del = false;
        i++;
        j = 0;
      }
      t = setTimeout(tick, del ? 30 : 70);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '64px 0 30px',
      textAlign: 'center',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 'var(--fs-hero)',
      letterSpacing: '.04em',
      lineHeight: 1,
      background: 'linear-gradient(180deg, #fff, var(--cyan))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      textShadow: '0 0 60px var(--cyan-glow)'
    }
  }, "DOUG CASHIO"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(13px,2.4vw,18px)',
      letterSpacing: '.34em',
      color: 'var(--accent)',
      marginTop: 12,
      textShadow: '0 0 16px var(--accent-glow)'
    }
  }, "ENTERPRISE AI & CYBERSECURITY"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(340px,70%)',
      height: 2,
      margin: '16px auto 2px',
      background: 'linear-gradient(90deg, transparent, var(--cyan), var(--green), var(--accent), transparent)',
      boxShadow: '0 0 14px var(--cyan-glow)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 780,
      margin: '26px auto 0',
      fontSize: 'var(--fs-body-lg)',
      lineHeight: 1.5
    }
  }, "A ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--cyan)',
      textShadow: '0 0 16px var(--cyan-glow)'
    }
  }, "19-node sovereign fleet"), " orchestrating five LLMs through one gateway \u2014 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--cyan)',
      textShadow: '0 0 16px var(--cyan-glow)'
    }
  }, "7.2\xD7 cheaper"), " inference, fully autonomous."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--green)',
      letterSpacing: '.18em',
      fontSize: 13,
      marginTop: 18,
      minHeight: 18,
      textShadow: '0 0 14px var(--green-glow)'
    }
  }, txt, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cyan)',
      animation: 'za-blink 1s step-end infinite'
    }
  }, "_")));
}

/* ---------------- Stat ribbon ---------------- */
function Ribbon() {
  const cells = [['19', 'NODE FLEET', 'cyan'], ['7.2×', 'COST CUT', 'green'], ['5', 'LLM MODELS', 'accent'], ['100%', 'AUTONOMOUS', 'amber'], ['99.98%', 'UPTIME', 'cyan']];
  const col = {
    cyan: ['var(--cyan)', 'var(--cyan-glow)'],
    green: ['var(--green)', 'var(--green-glow)'],
    accent: ['var(--accent)', 'var(--accent-glow)'],
    amber: ['var(--amber)', 'var(--amber-glow)']
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 14,
      margin: '18px 0 30px'
    }
  }, cells.map(([n, l, c]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    className: "za-statcell",
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '16px 10px',
      textAlign: 'center',
      backdropFilter: 'blur(8px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: 'clamp(22px,4vw,34px)',
      color: col[c][0],
      textShadow: `0 0 18px ${col[c][1]}`,
      lineHeight: 1
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.14em',
      color: 'var(--text-dim)',
      marginTop: 6
    }
  }, l))));
}

/* ---------------- Panel shell ---------------- */
function Panel({
  color = 'accent',
  title,
  icon,
  tag,
  children
}) {
  const rail = {
    accent: 'linear-gradient(180deg,var(--accent),var(--purple))',
    cyan: 'linear-gradient(180deg,var(--cyan),var(--green))',
    green: 'linear-gradient(180deg,var(--green),var(--cyan))',
    amber: 'linear-gradient(180deg,var(--amber),var(--accent))',
    purple: 'linear-gradient(180deg,var(--purple),var(--cyan))'
  }[color];
  const hc = {
    accent: 'var(--accent)',
    cyan: 'var(--cyan)',
    green: 'var(--green)',
    amber: 'var(--amber)',
    purple: 'var(--purple)'
  }[color];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      background: 'linear-gradient(158deg, rgba(22,22,40,.74), var(--surface) 62%)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '26px 26px 28px',
      margin: '26px 0',
      overflow: 'hidden',
      backdropFilter: 'var(--blur-glass)',
      boxShadow: 'var(--shadow-panel)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 6,
      background: rail
    }
  }), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
      flexWrap: 'wrap'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: 9,
      background: 'var(--glass)',
      border: `1px solid ${hc}`,
      boxShadow: `inset 0 0 14px ${hc}22, 0 0 16px -6px ${hc}`,
      fontSize: 15
    }
  }, icon), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '.06em'
    }
  }, title), tag, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 5,
      borderRadius: 5,
      flex: 1,
      minWidth: 40,
      background: `linear-gradient(90deg, ${hc}, transparent)`
    }
  })), children);
}
function Tag({
  color = 'cyan',
  children
}) {
  const c = {
    green: 'var(--green)',
    cyan: 'var(--cyan)',
    amber: 'var(--amber)',
    red: 'var(--red)'
  }[color] || color;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      padding: '3px 9px',
      borderRadius: 999,
      border: `1px solid ${c}`,
      color: c,
      background: 'rgba(255,255,255,.05)',
      boxShadow: `0 0 14px -5px ${c}`
    }
  }, children);
}
Object.assign(window, {
  Hud,
  Hero,
  Ribbon,
  Panel,
  Tag
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/command-center/components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/command-center/screens.jsx
try { (() => {
/* ZeusApollo Command Center — fleet table, model stack, interactive terminal. */
const {
  useState: useStateB,
  useEffect: useEffectB,
  useRef: useRefB
} = React;

/* ---------------- Model stack table ---------------- */
function ModelStack() {
  const rows = [['1', 'DeepSeek V4-Pro', 'DeepSeek API', 'Primary — agents, briefings', '$0.0004', false], ['2', 'Perplexity Sonar Pro', 'Perplexity', 'Deep research + citations', '$0.005', false], ['3', 'Gemini 2.5 Flash', 'Google AI', 'Compression + web extract', '$0.0001', false], ['4', 'Grok 4.3', 'xAI', 'Vision + TTS (Eve voice)', '$0.002', false], ['5', 'Qwen 3.7 Plus', 'Nous', 'Emergency failover only', 'free', true]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['#', 'MODEL', 'PROVIDER', 'ROLE', '$/CALL'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: 'left',
      padding: '10px 12px',
      borderBottom: '1px solid var(--glass-border)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      color: 'var(--text-dim)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([n, m, p, r, c, free]) => /*#__PURE__*/React.createElement("tr", {
    key: n,
    className: "za-card-hover",
    style: {
      transition: 'background var(--dur) var(--ease)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: td
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 20,
      height: 20,
      lineHeight: '20px',
      textAlign: 'center',
      borderRadius: 5,
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      color: 'var(--cyan)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontSize: 11
    }
  }, n)), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 13
    }
  }, m), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-dim)'
    }
  }, p), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: 'var(--text-dim)',
      fontSize: 13
    }
  }, r), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: 'var(--font-mono)',
      color: free ? 'var(--green)' : 'var(--accent)'
    }
  }, c))))));
}
const td = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--glass-border)'
};

/* ---------------- Fleet nodes ---------------- */
function FleetGrid() {
  const nodes = [['zeus-01', 'on'], ['zeus-02', 'on'], ['zeus-03', 'on'], ['zeus-04', 'on'], ['apollo-01', 'on'], ['apollo-02', 'on'], ['apollo-03', 'deg'], ['apollo-04', 'on'], ['atlas-m4', 'on'], ['edge-pi-01', 'on'], ['edge-pi-02', 'on'], ['gw-hermes', 'on']];
  const c = {
    on: 'var(--green)',
    deg: 'var(--amber)',
    emr: 'var(--red)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
      gap: 10
    }
  }, nodes.map(([n, s]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "za-card-hover",
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: c[s],
      boxShadow: `0 0 8px ${c[s]}`,
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text)'
    }
  }, n))));
}

/* ---------------- Interactive terminal ---------------- */
const COMMANDS = {
  help: () => [['ok', 'Available: status · fleet · stack · burn · route <q> · clear · whoami']],
  whoami: () => [['rt', 'doug@cashio.us'], ['dim', 'Principal Solutions Consultant · Enterprise AI & Cybersecurity']],
  status: () => [['ok', '✔ 19/19 nodes nominal · Zeus + Apollo clusters online'], ['dim', 'uptime 99.98% · burn $0.35/day · 1 node degraded (apollo-03)']],
  fleet: () => [['rt', 'ZEUS  ▸ infra + security  · 4 nodes'], ['rt', 'APOLLO ▸ AI + media        · 4 nodes'], ['rt', 'ATLAS ▸ Mac Mini M4 fallback'], ['dim', '+ edge devices · hermes gateway']],
  stack: () => [['rt', '1 DeepSeek V4-Pro  → primary'], ['rt', '2 Perplexity Sonar → research'], ['rt', '3 Gemini 2.5 Flash → compress'], ['rt', '4 Grok 4.3         → vision/TTS'], ['rt', '5 Qwen 3.7 Plus    → failover']],
  burn: () => [['ok', '$0.35 / day total inference burn'], ['dim', '7.2× cheaper than single-vendor baseline']]
};
function CmdTerminal() {
  const [log, setLog] = useStateB([['ascii', 'ZEUSAPOLLO // SOVEREIGN COMMAND DECK'], ['dim', "type 'help' to begin · 5 models · 1 gateway · no bridge tax"]]);
  const [val, setVal] = useStateB('');
  const bodyRef = useRefB(null);
  useEffectB(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log]);
  const run = raw => {
    const cmd = raw.trim();
    if (!cmd) return;
    const [name, ...args] = cmd.split(' ');
    let out;
    if (name === 'clear') {
      setLog([]);
      return;
    }
    if (name === 'route') out = [['acc', '→ DeepSeek V4-Pro'], ['ok', `200 OK · "${args.join(' ') || 'query'}" · 412ms · $0.0004`]];else if (COMMANDS[name]) out = COMMANDS[name]();else out = [['er', `command not found: ${name}`]];
    setLog(l => [...l, ['cmd', cmd], ...out]);
  };
  const col = {
    ok: 'var(--green)',
    rt: 'var(--cyan)',
    dim: 'var(--text-dim)',
    er: 'var(--red)',
    acc: 'var(--accent)',
    ascii: 'var(--cyan)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--void-deep)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-terminal)',
      fontFamily: 'var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: 'linear-gradient(180deg,#11141d,#0a0c12)',
      borderBottom: '1px solid var(--glass-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#ff5f56'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#ffbd2e'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: '#27c93f'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: '.1em',
      color: 'var(--text-dim)',
      marginLeft: 6
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--cyan)'
    }
  }, "hermes"), "://command-deck"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 10,
      color: 'var(--text-dim)'
    }
  }, "live")), /*#__PURE__*/React.createElement("div", {
    ref: bodyRef,
    style: {
      padding: '14px 16px',
      height: 300,
      overflowY: 'auto',
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--text)'
    }
  }, log.map((ln, i) => ln[0] === 'cmd' ? /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cyan)'
    }
  }, "doug@zeus"), ":~$ "), ln[1]) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: col[ln[0]] || 'var(--text)',
      whiteSpace: 'pre-wrap',
      textShadow: ln[0] === 'ascii' ? '0 0 10px var(--cyan-glow)' : 'none',
      fontWeight: ln[0] === 'ascii' ? 700 : 400
    }
  }, ln[1]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      borderTop: '1px solid var(--glass-border)',
      background: '#070810'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cyan)'
    }
  }, "doug@zeus"), ":~$"), /*#__PURE__*/React.createElement("input", {
    value: val,
    onChange: e => setVal(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        run(val);
        setVal('');
      }
    },
    placeholder: "type a command\u2026",
    style: {
      flex: 1,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: 'var(--text)',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      caretColor: 'var(--cyan)'
    },
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: '0 14px 12px',
      background: '#070810'
    }
  }, ['status', 'fleet', 'stack', 'burn', 'route "incident 4471"'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    className: "za-chip",
    onClick: () => run(c),
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-dim)',
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      borderRadius: 6,
      padding: '4px 10px',
      cursor: 'pointer'
    }
  }, c))));
}
Object.assign(window, {
  ModelStack,
  FleetGrid,
  CmdTerminal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/command-center/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.StatCell = __ds_scope.StatCell;

__ds_ns.Terminal = __ds_scope.Terminal;

__ds_ns.TerminalLine = __ds_scope.TerminalLine;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Input = __ds_scope.Input;

})();
