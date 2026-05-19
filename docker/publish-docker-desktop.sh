#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/publish-appname.sh"

bash "$SCRIPT_DIR/publish-prepare.sh"

cd "$SCRIPT_DIR/../publish"
docker compose --env-file .env.production -p "$DOCKER_APP_NAME" down --remove-orphans
docker compose --env-file .env.production -p "$DOCKER_APP_NAME" build --no-cache
docker compose --env-file .env.production -p "$DOCKER_APP_NAME" up -d
