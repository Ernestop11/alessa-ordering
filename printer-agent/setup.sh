#!/bin/bash
#
# Las Reinas Print Agent Setup
# This script sets up a background print agent that:
# 1. Polls the VPS for new orders
# 2. Prints them to the local printer via CUPS
# 3. Auto-starts on login (LaunchAgent)
#

set -e

# Configuration
VPS_URL="https://lasreinascolusa.com"
TENANT_SLUG="lasreinas"
AGENT_NAME="lasreinas-mac"
PLIST_NAME="com.lasreinas.printagent"
AGENT_DIR="$HOME/printer-agent"
SECRET_FILE="$HOME/.lasreinas-print-secret"

echo ""
echo "=========================================="
echo "  Las Reinas Print Agent Setup"
echo "=========================================="
echo ""

# Check Node.js - look in user install location first
NODE_BIN=""
if [ -f "$HOME/node-v20.18.1-darwin-arm64/bin/node" ]; then
    NODE_BIN="$HOME/node-v20.18.1-darwin-arm64/bin/node"
elif command -v node &> /dev/null; then
    NODE_BIN=$(which node)
fi

echo "Checking Node.js..."
if [ -z "$NODE_BIN" ]; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  1. Download from https://nodejs.org/"
    echo "  2. Or run: brew install node"
    echo ""
    exit 1
fi
NODE_VERSION=$("$NODE_BIN" -v)
echo "  Node.js: $NODE_BIN"
echo "  Version: $NODE_VERSION"

# List available printers
echo ""
echo "Available printers:"
echo "-------------------"
lpstat -p 2>/dev/null || echo "  No printers found. Please add a printer first."
echo ""

# Get default printer
DEFAULT_PRINTER=$(lpstat -d 2>/dev/null | awk -F': ' '{print $2}' || echo "")
if [ -n "$DEFAULT_PRINTER" ]; then
    echo "Default printer: $DEFAULT_PRINTER"
else
    echo "No default printer set. Will use system default."
fi
echo ""

# Generate or load secret
if [ -f "$SECRET_FILE" ]; then
    PRINT_AGENT_SECRET=$(cat "$SECRET_FILE")
    echo "Using existing secret from $SECRET_FILE"
else
    PRINT_AGENT_SECRET=$(openssl rand -hex 32)
    echo "$PRINT_AGENT_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    echo "Generated new secret, saved to $SECRET_FILE"
fi

# Create config file
echo ""
echo "Creating configuration..."
cat > "$AGENT_DIR/config.json" << EOF
{
  "vpsUrl": "$VPS_URL",
  "tenantSlug": "$TENANT_SLUG",
  "agentName": "$AGENT_NAME",
  "pollInterval": 5000,
  "printerHost": "auto",
  "printerPort": 9100,
  "secret": "$PRINT_AGENT_SECRET"
}
EOF
echo "  Created config.json"

# Create LaunchAgent plist
echo ""
echo "Creating LaunchAgent..."
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$HOME/Library/LaunchAgents/$PLIST_NAME.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>

    <key>ProgramArguments</key>
    <array>
        <string>$NODE_BIN</string>
        <string>$AGENT_DIR/print-agent.mjs</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$AGENT_DIR</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/lasreinas-print-agent.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/lasreinas-print-agent.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>VPS_URL</key>
        <string>$VPS_URL</string>
        <key>TENANT_SLUG</key>
        <string>$TENANT_SLUG</string>
        <key>PRINT_AGENT_SECRET</key>
        <string>$PRINT_AGENT_SECRET</string>
        <key>AGENT_NAME</key>
        <string>$AGENT_NAME</string>
    </dict>
</dict>
</plist>
EOF
echo "  Created $HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# Unload if already loaded
launchctl unload "$HOME/Library/LaunchAgents/$PLIST_NAME.plist" 2>/dev/null || true

# Load the agent
echo ""
echo "Starting print agent..."
launchctl load "$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# Wait a moment and check if running
sleep 2
if launchctl list | grep -q "$PLIST_NAME"; then
    echo "  Print agent is running!"
else
    echo "  WARNING: Agent may not have started. Check logs:"
    echo "  tail -f /tmp/lasreinas-print-agent.log"
fi

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Add this secret to your VPS:"
echo ""
echo "  PRINT_AGENT_SECRET=$PRINT_AGENT_SECRET"
echo ""
echo "On your VPS, run:"
echo "  ssh root@YOUR_VPS"
echo "  echo 'PRINT_AGENT_SECRET=$PRINT_AGENT_SECRET' >> /var/www/alessa-ordering/.env"
echo "  pm2 restart alessa-ordering"
echo ""
echo "Useful commands:"
echo "  View logs:    tail -f /tmp/lasreinas-print-agent.log"
echo "  Check status: launchctl list | grep printagent"
echo "  Restart:      launchctl unload ~/Library/LaunchAgents/$PLIST_NAME.plist && launchctl load ~/Library/LaunchAgents/$PLIST_NAME.plist"
echo "  Stop:         launchctl unload ~/Library/LaunchAgents/$PLIST_NAME.plist"
echo ""
