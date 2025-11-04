#!/usr/bin/env bash
set -euo pipefail

# Deployment helper for Hostinger VPS
# Usage: ./scripts/deploy.sh /path/to/project

TARGET_DIR=${1:-/var/www/alessa-ordering}

if [ ! -d "$TARGET_DIR" ]; then
  echo "Creating target directory $TARGET_DIR"
  sudo mkdir -p "$TARGET_DIR"
  sudo chown "$USER" "$TARGET_DIR"
fi

rsync -av --exclude="node_modules" --exclude=".next" --exclude="scripts/deploy.sh" ./ "$TARGET_DIR"/

cd "$TARGET_DIR"

npm ci
npm run build

pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save
