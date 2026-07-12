#!/usr/bin/env bash
# ZEUSAPOLLO GitHub Release Helper
# Usage:
#   ./scripts/create_release.sh v28
#   ./scripts/create_release.sh v28 --dry-run
#
# The tag-triggered GitHub workflow publishes RELEASE_BODY.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
cd "$REPO_DIR"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

dry_run=false
requested_version=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    v*)
      if [[ -n "$requested_version" ]]; then
        echo -e "${RED}Error:${NC} provide only one version tag."
        exit 1
      fi
      requested_version="$arg"
      ;;
    *)
      echo -e "${RED}Unknown argument:${NC} $arg"
      echo "Usage: $0 v28 [--dry-run]"
      exit 1
      ;;
  esac
done

if [[ -z "$requested_version" ]]; then
  # Supports v28, v28.1, v28.1a, and similar release labels.
  requested_version="$(git log --oneline -50 \
    | grep -oP '\bv[0-9]+(?:\.[0-9]+)*(?:[a-z][a-z0-9.-]*)?\b' \
    | head -1 || true)"
fi

if [[ -z "$requested_version" ]]; then
  echo -e "${RED}Error:${NC} no version detected. Pass one explicitly, for example: $0 v28"
  exit 1
fi

if [[ ! "$requested_version" =~ ^v[0-9]+([.][0-9]+)*([a-z][a-z0-9.-]*)?$ ]]; then
  echo -e "${RED}Error:${NC} invalid version format: $requested_version"
  exit 1
fi

if [[ ! -s RELEASE_BODY.md ]]; then
  echo -e "${RED}Error:${NC} RELEASE_BODY.md is missing or empty."
  exit 1
fi

if ! grep -Eq "^## .*${requested_version}([[:space:]]|$)" RELEASE_BODY.md; then
  echo -e "${RED}Error:${NC} RELEASE_BODY.md does not identify ${requested_version}."
  echo "Update the curated release notes before tagging."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo -e "${RED}Error:${NC} the working tree is not clean. Commit release documentation first."
  exit 1
fi

if git rev-parse -q --verify "refs/tags/${requested_version}" >/dev/null; then
  echo -e "${RED}Error:${NC} tag ${requested_version} already exists locally."
  exit 1
fi

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "main" ]]; then
  echo -e "${AMBER}Warning:${NC} creating a release tag from branch '${current_branch}', not 'main'."
fi

previous_tag="$(git describe --tags --abbrev=0 2>/dev/null || true)"
if [[ -n "$previous_tag" ]]; then
  log_range="${previous_tag}..HEAD"
else
  log_range="HEAD"
fi

echo -e "${CYAN}◆ Release:${NC} ${requested_version}"
echo -e "${CYAN}◆ Branch:${NC}  ${current_branch:-detached HEAD}"
echo -e "${CYAN}◆ Commit:${NC}  $(git rev-parse --short HEAD)"
[[ -n "$previous_tag" ]] && echo -e "${CYAN}◆ Previous:${NC} ${previous_tag}"

echo -e "\n${GREEN}Curated release notes:${NC}"
cat RELEASE_BODY.md

echo -e "\n${GREEN}Commits in release range:${NC}"
git log --oneline --no-decorate "$log_range" | head -40

if $dry_run; then
  echo -e "\n${AMBER}Dry run complete — no tag was created.${NC}"
  exit 0
fi

echo -e "\n${CYAN}◆ Creating annotated tag ${requested_version}...${NC}"
git tag -a "$requested_version" -m "Release ${requested_version}"

echo -e "${CYAN}◆ Pushing tag to origin...${NC}"
git push origin "$requested_version"

echo -e "${GREEN}✓ ${requested_version} pushed.${NC}"
echo "GitHub Actions will publish the release using RELEASE_BODY.md."
