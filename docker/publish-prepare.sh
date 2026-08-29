#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLISH_DIR="$ROOT_DIR/publish"
ENV_FILE="$SCRIPT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "Copie docker/.env.production.example vers docker/.env.production puis remplis les secrets."
  exit 1
fi

rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR/backend" "$PUBLISH_DIR/frontend" "$PUBLISH_DIR/docker"

cp "$ROOT_DIR/backend/manage.py" "$PUBLISH_DIR/backend/"
cp "$ROOT_DIR/backend/requirements.txt" "$PUBLISH_DIR/backend/"
cp -R "$ROOT_DIR/backend/accounts" "$PUBLISH_DIR/backend/accounts"
cp -R "$ROOT_DIR/backend/matches" "$PUBLISH_DIR/backend/matches"
cp -R "$ROOT_DIR/backend/matchnote" "$PUBLISH_DIR/backend/matchnote"

cp "$ROOT_DIR/frontend/package.json" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/package-lock.json" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/index.html" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/tsconfig.app.json" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/tsconfig.json" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/tsconfig.node.json" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/vite.config.ts" "$PUBLISH_DIR/frontend/"
cp "$ROOT_DIR/frontend/eslint.config.js" "$PUBLISH_DIR/frontend/"
cp -R "$ROOT_DIR/frontend/public" "$PUBLISH_DIR/frontend/public"
cp -R "$ROOT_DIR/frontend/src" "$PUBLISH_DIR/frontend/src"

cp "$SCRIPT_DIR/.env.production" "$PUBLISH_DIR/docker/.env.production"
cp "$SCRIPT_DIR/docker-compose.yml" "$PUBLISH_DIR/docker/docker-compose.yml"
cp "$SCRIPT_DIR/backend.Dockerfile" "$PUBLISH_DIR/docker/backend.Dockerfile"
cp "$SCRIPT_DIR/backend-entrypoint.sh" "$PUBLISH_DIR/docker/backend-entrypoint.sh"
cp "$SCRIPT_DIR/frontend.Dockerfile" "$PUBLISH_DIR/docker/frontend.Dockerfile"
cp "$SCRIPT_DIR/nginx.conf" "$PUBLISH_DIR/docker/nginx.conf"

echo "Dossier publish pret : $PUBLISH_DIR"
