# ZEUSAPOLLO v21.1 — Sovereign AI & Enterprise Cybersecurity

> *"The line between man and machine is not a wall — it's a bridge."*

A **live interactive portfolio** and **command center dashboard** showcasing a sovereign AI infrastructure spanning 18+ nodes across two hypervisors, a Mac Mini M4, and edge devices, orchestrated through event-driven architecture.

---

## 🚀 Overview

| Aspect | Detail |
|---|---|
| **Stack** | Vanilla HTML/CSS/JS + WebGL • Deployed via GitHub Pages |
| **Design System** | LCARS-inspired (Star Trek) • Dark cyberpunk aesthetic • Orange/Cyan signature palette |
| **Build State** | 234+ commits • 203+ deployments • 3 AI contributors |

---

## 🧠 AI Stack

This site interfaces with a real homelab AI fabric:

| Component | Role | Hardware |
|---|---|---|
| **Atlas** | Primary AI node — Gemma-4 26B MoE (MLX) | Mac Mini M4 (24GB) |
| **Cashiotuf** | GPU inference — LM Studio fallback | RTX 3080 (10GB) |
| **Hermes** | Operations agent — system orchestration | ZeusApollo CT |
| **Omnibus** | Sovereign mode — unrestricted reasoning | Atlas (Antigravity) |
| **Athena** | Edge broker — NATS event bus, DNS, monitoring | RPi4 |
| **n8n** | LLM router / workflow automation | ZeusApollo CT |
| **LiteLLM** | Multi-model proxy (Grok, Claude, Qwen) | ZeusApollo CT |

---

## 🛡️ Security

- **CSP** enforced via meta tag
- **DOM hardening** — no `innerHTML` injection (audited by Sentinel/Jules)
- **Zero-trust** model across the fleet
- **Regular security scanning** via automated PR pipeline

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `index.html` | Main portfolio — hero, skills, fleet topology |
| `command.html` | Command Center — live architecture, metrics, event ticker |
| `audio_engine.js` | Voice synthesis & LCARS sound effects |
| `webgl_starfield.js` | Animated starfield background canvas |
| `zeusapollo_swarm.py` | Multi-model orchestration (swarm mode) |
| `zeusapollo_bridge.py` | Speculative decoding bridge for Atlas |
| `status.json` | Fleet status data (auto-generated) |
| `tweaks-panel-2.jsx` | UI configuration panel |

---

## 🔄 Deployments

**GitHub Pages** — 203+ automated deployments. The site auto-deploys from `main` on each commit. No build step required.

---

## 🤝 Contributors

- **jamescashio** — Human operator / architect
- **claude** — AI pair programmer (Anthropic)
- **google-labs-jules[bot]** — Security auditor & automated PR fixer

---

## 📜 License

Private project. All rights reserved.
