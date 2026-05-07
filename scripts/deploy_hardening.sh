#!/usr/bin/env bash
# ───────────────────────────────────────────────
# ZEUSAPOLLO v21.2 Security Hardening Deploy
# Run from Athena (RPi4) or from Zeus via pct exec
# Usage: sudo bash deploy_hardening.sh
# ───────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}  ZEUSAPOLLO Security Hardening v1.0${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"

# ─── 1. NATS Hardening ───────────────────────────────────────────────────────

NATS_CONF="/etc/nats/nats.conf"
NATS_BACKUP="/etc/nats/nats.conf.bak.$(date +%s)"
NATS_TOKEN="${1:-$(openssl rand -hex 16)}"

echo -e "\n${GREEN}◆ Step 1/4: NATS Security${NC}"

if [ -f "$NATS_CONF" ]; then
  cp "$NATS_CONF" "$NATS_BACKUP"
  echo "  ✓ Backed up: $NATS_BACKUP"
fi

# Build hardened config
cat > "$NATS_CONF" << NATSEOF
port: 4222

# JetStream for durable event persistence
jetstream {
  store_dir: /var/lib/nats/jetstream
  max_memory_store: 268435456
  max_file_store: 1073741824
}

# Limits
max_payload: 2097152
max_connections: 128
max_subscriptions: 512

# Authentication
authorization {
  users [
    {user: omnius, password: "${NATS_TOKEN}"}
    {user: hermes,  password: "${NATS_TOKEN}"}
    {user: captain, password: "${NATS_TOKEN}"}
  ]
  default_permissions {
    publish:   {"allow": ["agent.>", "cluster.>", "inference.>", "captain.>"]}
    subscribe: {"allow": ["agent.>", "cluster.>", "inference.>", "captain.>", "_INBOX.>"]}
  }
}

# Leafnode for multi-site
leafnodes {
  port: 7422
}
NATSEOF

echo "  ✓ Config written: $NATS_CONF"

# Ensure JetStream directory exists
mkdir -p /var/lib/nats/jetstream
echo "  ✓ JetStream directory created"

# Restart NATS
if systemctl is-active nats-server &>/dev/null; then
  systemctl restart nats-server
  echo "  ✓ NATS restarted"
else
  echo -e "  ${RED}⚠ NATS not a systemd service — restart manually${NC}"
fi

echo -e "\n${GREEN}◆ Step 2/4: NATS Monitoring Lockdown${NC}"
# NATS monitoring (8222) has no auth in core — bind to localhost only
# Requires: --http_port or use iptables to restrict
if command -v iptables &>/dev/null; then
  iptables -A INPUT -p tcp --dport 8222 ! -s 192.168.1.0/24 -j DROP 2>/dev/null || true
  echo "  ✓ iptables rule added: monitoring restricted to LAN"
fi

echo -e "\n${GREEN}◆ Step 3/4: Credential Store${NC}"
# Save creds
cat > /root/.nats_creds << CREDSEOF
NATS_TOKEN=${NATS_TOKEN}
NATS_URL=nats://hermes:${NATS_TOKEN}@192.168.1.32:4222
NATS_MONITOR=http://192.168.1.32:8222
CREDSEOF
chmod 600 /root/.nats_creds
echo "  ✓ Credentials saved: /root/.nats_creds"

echo -e "\n${GREEN}◆ Step 4/4: Swarm Bridge Auth${NC}"
echo "  Set SWARM_API_KEY in environment or deploy with:"
echo "  export SWARM_API_KEY=<key-from-auth.json>"

echo -e "\n${CYAN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Token: ${NATS_TOKEN}${NC}"
echo -e "${GREEN}  Next: Update auth.json with this token${NC}"
echo -e "${GREEN}  Then: Restart NATS bridge on Hermes CT${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
