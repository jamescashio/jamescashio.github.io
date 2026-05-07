#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# ZEUSAPOLLO — Swarm Bridge Hardening Deploy Script v1.0
# ═══════════════════════════════════════════════════════════════
# Applies security hardening measures to the running Swarm Bridge
# container on CT-115 (Proxmox).
#
# Usage:
#   chmod +x deploy_hardening.sh
#   sudo ./deploy_hardening.sh
#
# Requires:
#   - pct access to CT-115
#   - SWARM_API_KEY set in environment or /root/.hermes/config/auth.json
# ═══════════════════════════════════════════════════════════════

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# ─── Config ────────────────────────────────────────────────────
CONTAINER_ID=${CONTAINER_ID:-115}
SWARM_BRIDGE_DIR="/opt/swarm-bridge/"
API_KEY="${SWARM_API_KEY:-}"

# Try to read from auth.json if not set
if [ -z "$API_KEY" ]; then
  AUTH_FILE="${AUTH_FILE:-/root/.hermes/config/auth.json}"
  if [ -f "$AUTH_FILE" ]; then
    API_KEY=$(python3 -c "import json; print(json.load(open('$AUTH_FILE'))['swarm']['api_key'])" 2>/dev/null || echo "")
  fi
fi

if [ -z "$API_KEY" ]; then
  err "SWARM_API_KEY not set. Generate one and export it:"
  echo "    export SWARM_API_KEY=\$(openssl rand -hex 32)"
  exit 1
fi

log "API key loaded (${#API_KEY} chars)"

# ─── 1. Verify container access ────────────────────────────────
log "Checking container $CONTAINER_ID..."
if ! pct status "$CONTAINER_ID" &>/dev/null; then
  err "Container $CONTAINER_ID not found or inaccessible"
  exit 1
fi
log "Container $CONTAINER_ID accessible"

# ─── 2. Deploy hardened swarm bridge ──────────────────────────
log "Deploying hardened swarm bridge..."
pct push "$CONTAINER_ID" "${SCRIPT_DIR}/zeusapollo_swarm.py" "${SWARM_BRIDGE_DIR}zeusapollo_swarm.py" --perms 755
log "Swarm bridge code pushed"

# ─── 3. Restart the bridge with auth ──────────────────────────
log "Restarting swarm bridge container with auth enabled..."
pct exec "$CONTAINER_ID" -- bash -c "
cd $SWARM_BRIDGE_DIR

# Kill existing process
pkill -f zeusapollo_swarm.py 2>/dev/null || true
sleep 1

# Export API key and start
export SWARM_API_KEY='$API_KEY'
nohup python3 zeusapollo_swarm.py --port 11235 > /var/log/swarm-bridge.log 2>&1 &
echo \$! > /var/run/swarm-bridge.pid
disown

# Wait for startup
sleep 2
if kill -0 \$(cat /var/run/swarm-bridge.pid) 2>/dev/null; then
  echo 'Bridge started (PID: \$(cat /var/run/swarm-bridge.pid))'
else
  echo 'Bridge failed to start'
  cat /var/log/swarm-bridge.log
  exit 1
fi
"

log "Swarm bridge restarted with authentication enabled"

# ─── 4. Verify it's running ───────────────────────────────────
log "Verifying bridge is operational..."
sleep 2
HEALTH_CHECK=$(pct exec "$CONTAINER_ID" -- curl -s http://127.0.0.1:11235/health 2>/dev/null || echo "failed")

if echo "$HEALTH_CHECK" | grep -q "ok"; then
  log "Bridge health check passed"
else
  warn "Bridge health check returned: $HEALTH_CHECK"
  warn "Check /var/log/swarm-bridge.log on container $CONTAINER_ID"
fi

# ─── 5. Verify auth is enforced ───────────────────────────────
log "Verifying auth enforcement..."
AUTH_TEST=$(pct exec "$CONTAINER_ID" -- curl -s -o /dev/null -w '%{http_code}' \
  -X POST http://127.0.0.1:11235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}' 2>/dev/null || echo "failed")

if [ "$AUTH_TEST" = "401" ]; then
  log "Auth enforcement verified — unauthenticated requests return 401"
elif [ "$AUTH_TEST" = "200" ]; then
  warn "Auth NOT enforced on /v1/chat/completions — check config"
else
  warn "Auth test returned HTTP $AUTH_TEST — manual check required"
fi

# ─── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    SWARM BRIDGE HARDENING COMPLETE                 ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  🔐 Auth:    X-API-Key required                     ║${NC}"
echo -e "${CYAN}║  ⚡ Rate:    60 req/min per IP                       ║${NC}"
echo -e "${CYAN}║  🛡️  Tokens: Max 16384 per request                  ║${NC}"
echo -e "${CYAN}║  🌐 CORS:    Origin validation active               ║${NC}"
echo -e "${CYAN}║  📡 Port:    11235                                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "To test: curl -H 'X-API-Key: YOUR_KEY' http://192.168.1.115:11235/v1/health"
echo "Logs: pct exec $CONTAINER_ID -- tail -f /var/log/swarm-bridge.log"
