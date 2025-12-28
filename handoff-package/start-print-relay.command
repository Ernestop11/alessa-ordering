#!/bin/bash
# Las Reinas Print Relay - Double-click to start
# This connects to the thermal printer and prints orders automatically

cd "$(dirname "$0")"

echo ""
echo "======================================"
echo "  Las Reinas Print Relay"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Run the print relay with auto-discovery
PRINT_RELAY_API_KEY=5d04d92921c8c4c73afbae811f03b07186ae207bc5a1b7bfc14a0fd3841d4397 node local-print-relay.mjs

# Keep window open if there's an error
read -p "Press Enter to exit..."
