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
  cd $REMOTE_DIR &&
  docker compose --env-file .env.production -p $DOCKER_APP_NAME down --remove-orphans || true &&
  docker compose --env-file .env.production -p $DOCKER_APP_NAME build --no-cache &&
  docker compose --env-file .env.production -p $DOCKER_APP_NAME up -d
"
