#!/bin/bash
# Script to move CoreSimulator to external drive
# Run with: sudo ./move-coresimulator.sh

set -e

EXTERNAL_DRIVE="/Volumes/AlessaCloud/alessa-ordering-builds"
CORESIMULATOR_SOURCE="/Library/Developer/CoreSimulator"
CORESIMULATOR_DEST="$EXTERNAL_DRIVE/CoreSimulator"

if [ ! -d "$EXTERNAL_DRIVE" ]; then
    echo "❌ External drive not found at $EXTERNAL_DRIVE"
    exit 1
fi

if [ ! -d "$CORESIMULATOR_SOURCE" ]; then
    echo "⚠️  CoreSimulator directory not found at $CORESIMULATOR_SOURCE"
    exit 0
fi

if [ -L "$CORESIMULATOR_SOURCE" ]; then
    echo "✅ CoreSimulator is already a symlink"
    exit 0
fi

echo "📦 Moving CoreSimulator (this may take a while, ~96GB)..."
sudo mv "$CORESIMULATOR_SOURCE" "$CORESIMULATOR_DEST"

echo "🔗 Creating symlink..."
sudo ln -s "$CORESIMULATOR_DEST" "$CORESIMULATOR_SOURCE"

echo "✅ CoreSimulator moved and symlinked successfully!"
echo "   Source: $CORESIMULATOR_SOURCE"
echo "   Destination: $CORESIMULATOR_DEST"










