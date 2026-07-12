#!/usr/bin/env bash
# Public-safe deployment template for an authenticated bridge service.
#
# This file intentionally contains no production hostnames, addresses, container
# identifiers, filesystem layouts, or credentials. Keep the operational script
# in a private repository and inject values through environment variables.

set -euo pipefail

: "${DEPLOY_TARGET:?Set DEPLOY_TARGET to a private deployment target}"
: "${SERVICE_DIR:?Set SERVICE_DIR to the private service directory}"
: "${SERVICE_NAME:?Set SERVICE_NAME to the service name}"
: "${SWARM_API_KEY:?Set SWARM_API_KEY; deployment refuses to continue without it}"

SOURCE_FILE="${SOURCE_FILE:-scripts/zeusapollo_swarm.py}"
HEALTH_URL="${HEALTH_URL:-http://localhost:11235/health}"
AUTH_TEST_URL="${AUTH_TEST_URL:-http://localhost:11235/v1/chat/completions}"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Source file not found: $SOURCE_FILE" >&2
  exit 1
fi

if [[ ${#SWARM_API_KEY} -lt 32 ]]; then
  echo "SWARM_API_KEY must be at least 32 characters" >&2
  exit 1
fi

printf 'Deploying %s to the configured private target...\n' "$SERVICE_NAME"

# Replace these functions in the private operational copy with the deployment
# mechanism appropriate for the environment. Do not commit target-specific
# commands, addresses, credentials, or paths to this public repository.
deploy_file() {
  echo "Public template: copy $SOURCE_FILE to $DEPLOY_TARGET:$SERVICE_DIR"
}

restart_service() {
  echo "Public template: restart $SERVICE_NAME with SWARM_API_KEY supplied securely"
}

verify_service() {
  echo "Public template: verify $HEALTH_URL"
  echo "Public template: confirm an unauthenticated request to $AUTH_TEST_URL returns 401"
}

deploy_file
restart_service
verify_service

echo "Template completed. Execute the private operational deployment procedure separately."
