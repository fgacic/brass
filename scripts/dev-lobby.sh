#!/usr/bin/env bash
set -euo pipefail
export BRASS_DEV_LOBBY=1
export NEXT_PUBLIC_BRASS_DEV_LOBBY=1
exec node "$(dirname "$0")/../server.js"
