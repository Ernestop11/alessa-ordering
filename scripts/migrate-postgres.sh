#!/usr/bin/env bash
set -euo pipefail

npx prisma generate
npx prisma migrate dev --name init_postgres

echo "✅ PostgreSQL migration completed."
