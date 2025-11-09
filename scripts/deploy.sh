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

# Reload only this specific app by name to avoid affecting other PM2 processes
pm2 reload alessa-ordering || pm2 start ecosystem.config.js
pm2 save --force
