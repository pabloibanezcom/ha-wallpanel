#!/usr/bin/env bash
set -euo pipefail

: "${HA_SSH_HOST:?HA_SSH_HOST is required}"
: "${HA_SSH_USER:?HA_SSH_USER is required}"

PORT="${HA_SSH_PORT:-22}"
REMOTE_DIR="${HA_REMOTE_DIR:-/config/www/ha-wallpanel}"
TARGET="${HA_SSH_USER}@${HA_SSH_HOST}"

ssh -p "${PORT}" "${TARGET}" "mkdir -p '${REMOTE_DIR}'"

if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete -e "ssh -p ${PORT}" dist/ "${TARGET}:${REMOTE_DIR}/"
else
  ssh -p "${PORT}" "${TARGET}" "find '${REMOTE_DIR}' -mindepth 1 -delete"
  scp -P "${PORT}" -r dist/. "${TARGET}:${REMOTE_DIR}/"
fi

echo "Deployed dist/ to ${TARGET}:${REMOTE_DIR}"
