#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶︎ Alessa Cloud verification"
echo "   workspace: ${ROOT_DIR}"
echo

pushd "${ROOT_DIR}" >/dev/null

echo "1) Seeding database with latest demo data…"
npm run db:seed
echo

echo "2) Running lint and type checks…"
npm run verify
echo

echo "✅ Automated checks complete."
echo
echo "Next steps:"
echo " • Start the dev server: npm run dev"
echo " • Walk through docs/VERIFICATION.md for manual QA (accessibility toggles, membership points, cart flows)."

popd >/dev/null
