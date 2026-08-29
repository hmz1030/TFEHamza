#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/publish-appname.sh"

bash "$SCRIPT_DIR/publish-prepare.sh"

PUBLISH_DIR="$SCRIPT_DIR/../publish"
REMOTE_DIR="~/$DOCKER_APP_NAME"

ssh -p "$GCLOUD_SSH_PORT" "$GCLOUD_USER@$GCLOUD_HOST" "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"
scp -P "$GCLOUD_SSH_PORT" -r "$PUBLISH_DIR"/. "$GCLOUD_USER@$GCLOUD_HOST:$REMOTE_DIR/"

ssh -p "$GCLOUD_SSH_PORT" "$GCLOUD_USER@$GCLOUD_HOST" "
  set -e
  cd $REMOTE_DIR
  docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p $DOCKER_APP_NAME down --remove-orphans || true
  docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p $DOCKER_APP_NAME build --no-cache
  docker compose -f docker/docker-compose.yml --env-file docker/.env.production -p $DOCKER_APP_NAME up -d
"
