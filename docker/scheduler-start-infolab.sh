#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/publish-appname.sh"

ssh -p "$INFOLAB_SSH_PORT" "$INFOLAB_USER@$INFOLAB_HOST" "
  cd ~/$DOCKER_APP_NAME &&
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD='docker compose'
  else
    COMPOSE_CMD='docker-compose'
  fi
  \$COMPOSE_CMD --env-file .env.production -p $DOCKER_APP_NAME start scheduler
"
