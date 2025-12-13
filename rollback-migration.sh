#!/bin/bash

# Rollback Script: Restore original folders from external drive
# Removes symlinks and restores original directories

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

EXTERNAL_DRIVE="/Volumes/AlessaCloud"
BACKUP_DIR="$EXTERNAL_DRIVE/DeveloperBackup"

echo -e "${BLUE}=== Rollback Script ===${NC}\n"

# Function to restore folder
restore_folder() {
    local symlink=$1
    local external_path=$2
    local name=$3
    
    echo -e "${BLUE}--- Restoring: $name ---${NC}"
    
    if [ ! -L "$symlink" ]; then
        echo -e "${YELLOW}⚠ Not a symlink: $symlink${NC}\n"
        return
    fi
    
    if [ ! -d "$external_path" ]; then
        echo -e "${RED}✗ External path not found: $external_path${NC}\n"
        return
    fi
    
    # Remove symlink
    echo -e "Removing symlink..."
    rm "$symlink"
    
    # Copy back from external
    echo -e "Copying back from external drive..."
    rsync -avh --progress "$external_path/" "$symlink/"
    
    echo -e "${GREEN}✓ Restored: $name${NC}\n"
}

# Restore folders
restore_folder \
    "$HOME/Library/Developer/Xcode/DerivedData" \
    "$BACKUP_DIR/Library/Developer/Xcode/DerivedData" \
    "Xcode DerivedData"

restore_folder \
    "$HOME/Library/Developer/Xcode/iOS DeviceSupport" \
    "$BACKUP_DIR/Library/Developer/Xcode/iOS DeviceSupport" \
    "iOS DeviceSupport"

if [ -L "$HOME/Library/Caches/com.apple.dt.Xcode" ]; then
    restore_folder \
        "$HOME/Library/Caches/com.apple.dt.Xcode" \
        "$BACKUP_DIR/Library/Caches/com.apple.dt.Xcode" \
        "Xcode Caches"
fi

if [ -L "$HOME/.npm" ]; then
    restore_folder \
        "$HOME/.npm" \
        "$BACKUP_DIR/.npm" \
        "npm cache"
fi

echo -e "${GREEN}=== Rollback Complete ===${NC}"


