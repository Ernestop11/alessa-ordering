#!/bin/bash
# Clean Dev Server Restart
# Ensures environment variables are reloaded fresh

echo "🧹 Cleaning Next.js caches..."
rm -rf .next node_modules/.cache 2>/dev/null

echo "🔫 Killing existing dev servers..."
pkill -9 -f "next dev" 2>/dev/null
sleep 1

echo "✅ Caches cleared and servers stopped"
echo ""
echo "🚀 Starting clean dev server..."
npm run dev
