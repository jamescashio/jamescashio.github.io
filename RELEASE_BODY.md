## 🚀 v21.2a — Hardened Sovereign AI Infrastructure

**Opus 4.7 security audit completed. All critical issues resolved.**

### 🔐 Security Hardening

| # | Issue | Fix | Impact |
|---|---|---|---|
| **C1** | Auth fail-open | X-API-Key middleware on all /v1/ routes | Unauthenticated requests → 401 |
| **C2** | No rate limiting | Token bucket: 60 req/min per IP | DoS protection |
| **C3** | Shared NATS password | Per-deploy token generation | Credential isolation |
| **C4** | No input validation | max_tokens capped at 16,384 | Financial DoS prevention |
| **C5** | CSP too permissive | Removed unpkg.com from script-src | Tightened script sources |
| **C6** | No CSRF protection | CORS origin validation + security headers | Browser-origin protection |

### 🛡️ Security Headers Added
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### 🔧 Infrastructure Changes
- **Swarm Bridge v1.2** — Rewritten auth middleware with env/config-driven API key loading
- **Rate limiter** — Per-IP sliding window (defaultdict + pruning)
- **Input validator** — Type/range checks on max_tokens, 32K char prompt cap
- **CORS validator** — Origin + Referer whitelist (10 known hosts)
- **Two-tier health** — `/health` (public, minimal) vs `/v1/health` (auth'd, full topology)
- **Deploy script** — `deploy_hardening.sh` with auth verification test

### ✅ What Was Already Fixed
- Swarm bridge API key in `auth.json`
- LiteLLM Anthropic key restored (Opus 4.7 confirmed working)
- NATS JetStream persistent deployment on CT-115 NVMe

### 📦 Files Changed
- `zeusapollo_swarm.py` — Full hardening (+377 lines of auth/rate-limit/CORS/validation)
- `index.html` — CSP meta tag tightened (no unpkg CDN), SEO metadata restored
- `status.json` — Security posture section added
- `deploy_hardening.sh` — NEW: automated deploy script with verification
- `README.md` — Updated for v21.2a

### 🧪 Verification
```bash
# Test auth enforcement
curl -s -o /dev/null -w '%{http_code}' -X POST \
  http://192.168.1.115:11235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
# → 401 (Unauthorized)

# Test with valid key
curl -s -H 'X-API-Key: YOUR_KEY' \
  http://192.168.1.115:11235/v1/health
# → full topology
```
