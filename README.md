# ZEUSAPOLLO v27 — Hardened Sovereign AI Infrastructure

> *"The line between man and machine is not a wall — it's a bridge."*

A **live interactive portfolio** and **command center dashboard** showcasing a sovereign AI infrastructure spanning 19 nodes across two hypervisors, a Mac Mini M4, and edge devices, orchestrated through event-driven architecture.

---

## 🚀 Overview

| Aspect | Detail |
|---|---|
| **Stack** | Vanilla HTML/CSS/JS • Self-hosted fonts • Deployed via GitHub Pages |
| **Design System** | LCARS-inspired (Star Trek) • Dark cyberpunk aesthetic • Orange/Cyan signature palette |
| **Build State** | 235+ commits • 204+ deployments • 3 AI contributors |

---

## 🧠 AI Stack — v27 "Sovereign Routing"

Every request routes **directly** to the cheapest model that can do the job — five models, one gateway, no bridge tax:

| # | Model | Provider | Role |
|---|---|---|---|
| 1 | **DeepSeek V4-Pro** | DeepSeek API | Primary — all agent tasks, briefings, delegation |
| 2 | **Perplexity Sonar Pro** | Perplexity API | Deep research with citations |
| 3 | **Gemini 2.5 Flash** | Google AI | Compression + web extract |
| 4 | **Grok 4.3** | xAI (SuperGrok) | Vision + TTS (Eve voice) |
| 5 | **Qwen 3.7 Plus** | Nous | Emergency failover only |

Runs on a two-cluster Proxmox fabric (**Zeus** — infra + security; **Apollo** — AI + media) plus an **Atlas** Mac Mini M4 for local LiteLLM fallback. ~$0.35/day total inference burn.

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
| `zeusapollo_swarm.py` | Multi-model orchestration (swarm mode) |
| `zeusapollo_bridge.py` | Speculative decoding bridge for Atlas |
| `status.json` | Fleet status data (auto-generated) |

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
