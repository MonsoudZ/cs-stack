#!/usr/bin/env bash
# Run the visual-regression suite inside the pinned Playwright Linux container,
# so snapshots are pixel-identical to CI regardless of the developer's OS.
#
#   npm run test:visual:docker            # check against committed baselines
#   npm run test:visual:docker:update     # (re)generate baselines
#
# The repo is mounted into the container, but node_modules is shadowed by a
# named volume so the host's (macOS) node_modules is never touched — the
# container does its own `npm ci` into that volume (cached across runs).
set -euo pipefail

# Keep this tag in sync with the @playwright/test version in package-lock.json.
IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"
NODE_VOL="thestack_vr_node"
REPO="$(cd "$(dirname "$0")/.." && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

echo "→ Running visual suite in $IMAGE (node_modules in volume $NODE_VOL)"
docker run --rm -i \
  -v "$REPO":/app -w /app \
  -v "$NODE_VOL":/app/node_modules \
  -e CI=1 \
  "$IMAGE" \
  bash -lc "npm ci --no-audit --no-fund && npm run test:visual -- $*"
