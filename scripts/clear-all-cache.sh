#!/bin/bash

# Clear All Cache Script
# Clears Next.js cache, browser cache hints, and forces revalidation

echo "🧹 Clearing all caches..."

# Clear Next.js build cache
echo "Clearing .next cache..."
rm -rf .next/cache 2>/dev/null || true
rm -rf .next/server 2>/dev/null || true

# Clear any other cache directories
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true

echo "✅ Cache cleared!"
echo ""
echo "💡 To clear browser cache:"
echo "   - Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   - Firefox: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)"
echo "   - Safari: Cmd+Option+R"
echo ""
echo "💡 The server will rebuild cache on next request."

