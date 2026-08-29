#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/publish-appname.sh"

bash "$SCRIPT_DIR/publish-prepare.sh"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "Docker Compose est introuvable."
    exit 1
  fi
}

cd "$SCRIPT_DIR/../publish"
compose -f docker/docker-compose.yml --env-file docker/.env.production -p "$DOCKER_APP_NAME" down --remove-orphans
compose -f docker/docker-compose.yml --env-file docker/.env.production -p "$DOCKER_APP_NAME" build --no-cache
compose -f docker/docker-compose.yml --env-file docker/.env.production -p "$DOCKER_APP_NAME" up -d
