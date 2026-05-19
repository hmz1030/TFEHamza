#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/publish-appname.sh"

bash "$SCRIPT_DIR/publish-prepare.sh"

PUBLISH_DIR="$SCRIPT_DIR/../publish"
REMOTE_DIR="~/$DOCKER_APP_NAME"

ssh -p "$INFOLAB_SSH_PORT" "$INFOLAB_USER@$INFOLAB_HOST" "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"
scp -P "$INFOLAB_SSH_PORT" -r "$PUBLISH_DIR"/. "$INFOLAB_USER@$INFOLAB_HOST:$REMOTE_DIR/"

ssh -p "$INFOLAB_SSH_PORT" "$INFOLAB_USER@$INFOLAB_HOST" "
  set -e
  cd $REMOTE_DIR &&
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD='docker compose'
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD='docker-compose'
  else
    echo 'Docker Compose est introuvable.'
    exit 1
  fi
  \$COMPOSE_CMD --env-file .env.production -p $DOCKER_APP_NAME down --remove-orphans || true
  \$COMPOSE_CMD --env-file .env.production -p $DOCKER_APP_NAME build --no-cache
  \$COMPOSE_CMD --env-file .env.production -p $DOCKER_APP_NAME up -d
"
