#!/usr/bin/env bash
# Publish one workspace package to npm from the release workflow.
#
#   scripts/publish-package.sh <dir under packages/> [--wait]
#
# - If this version is already on npm, skip (no build, no publish).
# - If publishing fails because the version already exists (e.g. another run won the race), skip.
# - Any other publish failure fails the job. (The old `pnpm publish || true` hid real failures.)
# - With --wait, block until the version is visible on npm so dependent jobs can install it,
#   and fail if it never shows up.
set -euo pipefail

DIR="packages/$1"
WAIT="${2:-}"
NAME=$(node -p "require('./$DIR/package.json').name")
VERSION=$(node -p "require('./$DIR/package.json').version")

is_published() {
  npm view "$NAME@$VERSION" version >/dev/null 2>&1
}

wait_for_npm() {
  for i in $(seq 1 60); do
    if is_published; then
      echo "$NAME@$VERSION is available on npm."
      return 0
    fi
    echo "Waiting for $NAME@$VERSION... ($i/60)"
    sleep 5
  done
  echo "::error::$NAME@$VERSION did not appear on npm within 5 minutes."
  return 1
}

if is_published; then
  echo "$NAME@$VERSION is already on npm; skipping."
else
  pnpm install
  pnpm --filter "$NAME..." build

  DIST_TAG=latest
  if [[ "$VERSION" == *-* ]]; then
    DIST_TAG=next
  fi

  LOG=$(mktemp)
  if ! (cd "$DIR" && pnpm publish --access public --provenance --tag "$DIST_TAG" --no-git-checks) 2>&1 | tee "$LOG"; then
    if grep -qiE 'E409|EPUBLISHCONFLICT|cannot publish over' "$LOG"; then
      echo "$NAME@$VERSION was published by another run; skipping."
    else
      echo "::error::Failed to publish $NAME@$VERSION."
      exit 1
    fi
  fi
fi

if [[ "$WAIT" == "--wait" ]]; then
  wait_for_npm
fi
