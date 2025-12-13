#!/bin/bash

# Migration Script: Move developer folders to external drive
# Creates symlinks back to original locations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# External drive mount point
EXTERNAL_DRIVE="/Volumes/AlessaCloud"
BACKUP_DIR="$EXTERNAL_DRIVE/DeveloperBackup"

echo -e "${BLUE}=== Migration Script ===${NC}\n"

# Verify external drive is mounted
if [ ! -d "$EXTERNAL_DRIVE" ]; then
    echo -e "${RED}ERROR: External drive not found at $EXTERNAL_DRIVE${NC}"
    exit 1
fi

# Create backup directory structure
echo -e "${YELLOW}Creating backup directory structure...${NC}"
mkdir -p "$BACKUP_DIR/Library/Developer/Xcode"
mkdir -p "$BACKUP_DIR/Library/Caches"
mkdir -p "$BACKUP_DIR/.npm"
echo -e "${GREEN}✓ Directory structure created${NC}\n"

# Function to move folder and create symlink
move_and_link() {
    local source=$1
    local dest=$2
    local name=$3
    
    echo -e "${BLUE}--- Processing: $name ---${NC}"
    
    if [ ! -d "$source" ]; then
        echo -e "${YELLOW}⚠ Skipping (not found): $source${NC}\n"
        return
    fi
    
    # Check if already a symlink
    if [ -L "$source" ]; then
        echo -e "${YELLOW}⚠ Already a symlink: $source${NC}\n"
        return
    fi
    
    # Check if destination already exists
    if [ -d "$dest" ]; then
        echo -e "${YELLOW}⚠ Destination exists, checking if migration already done...${NC}"
        if [ -L "$source" ]; then
            echo -e "${GREEN}✓ Already migrated${NC}\n"
            return
        fi
    fi
    
    # Show size before move
    local size=$(du -sh "$source" 2>/dev/null | cut -f1)
    echo -e "Size: ${YELLOW}$size${NC}"
    
    # Move with rsync (preserves permissions, shows progress)
    echo -e "Moving to external drive..."
    rsync -avh --progress "$source/" "$dest/" || {
        echo -e "${RED}✗ rsync failed${NC}"
        return 1
    }
    
    # Verify move
    echo -e "Verifying..."
    local source_size=$(du -sk "$source" 2>/dev/null | cut -f1)
    local dest_size=$(du -sk "$dest" 2>/dev/null | cut -f1)
    
    if [ "$source_size" -eq "$dest_size" ] || [ "$dest_size" -gt "$source_size" ]; then
        echo -e "${GREEN}✓ Verification passed${NC}"
        
        # Backup original (rename with timestamp)
        echo -e "Backing up original..."
        mv "$source" "${source}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Create symlink
        echo -e "Creating symlink..."
        ln -s "$dest" "$source"
        
        echo -e "${GREEN}✓ Migration complete for $name${NC}\n"
    else
        echo -e "${RED}✗ Verification failed (sizes don't match)${NC}"
        echo -e "${YELLOW}Original preserved, please check manually${NC}\n"
        return 1
    fi
}

# Pause function (skip if NO_PAUSE env var is set)
pause() {
    if [ -z "$NO_PAUSE" ]; then
        echo -e "\n${YELLOW}Press Enter to continue to next step, or Ctrl+C to abort...${NC}"
        read -r
    else
        echo -e "\n${YELLOW}Continuing automatically...${NC}"
        sleep 2
    fi
}

# Step 1: Xcode DerivedData
echo -e "${YELLOW}=== Step 1: Xcode DerivedData ===${NC}"
move_and_link \
    "$HOME/Library/Developer/Xcode/DerivedData" \
    "$BACKUP_DIR/Library/Developer/Xcode/DerivedData" \
    "Xcode DerivedData"
pause

# Step 2: iOS DeviceSupport
echo -e "${YELLOW}=== Step 2: iOS DeviceSupport ===${NC}"
move_and_link \
    "$HOME/Library/Developer/Xcode/iOS DeviceSupport" \
    "$BACKUP_DIR/Library/Developer/Xcode/iOS DeviceSupport" \
    "iOS DeviceSupport"
pause

# Step 3: Library Caches (selective - be careful)
echo -e "${YELLOW}=== Step 3: Library Caches (Xcode related only) ===${NC}"
echo -e "${YELLOW}Moving Xcode-related caches only...${NC}"

# Move Xcode caches specifically
if [ -d "$HOME/Library/Caches/com.apple.dt.Xcode" ]; then
    move_and_link \
        "$HOME/Library/Caches/com.apple.dt.Xcode" \
        "$BACKUP_DIR/Library/Caches/com.apple.dt.Xcode" \
        "Xcode Caches"
    pause
fi

# Step 4: npm cache
echo -e "${YELLOW}=== Step 4: npm cache ===${NC}"
if [ -d "$HOME/.npm" ]; then
    move_and_link \
        "$HOME/.npm" \
        "$BACKUP_DIR/.npm" \
        "npm cache"
    pause
fi

# Step 5: Xcode Archives (optional - uncomment if needed)
# echo -e "${YELLOW}=== Step 5: Xcode Archives ===${NC}"
# move_and_link \
#     "$HOME/Library/Developer/Xcode/Archives" \
#     "$BACKUP_DIR/Library/Developer/Xcode/Archives" \
#     "Xcode Archives"
# pause

echo -e "\n${GREEN}=== Migration Complete ===${NC}"
echo -e "All folders have been moved to: ${BLUE}$BACKUP_DIR${NC}"
echo -e "Symlinks created at original locations"
echo -e "\n${YELLOW}Note:${NC} Original folders backed up with .backup.* suffix"
echo -e "You can remove backups after verifying everything works:"
echo -e "  find ~/Library/Developer/Xcode -name '*.backup.*' -type d"
echo -e "\n${GREEN}Test Xcode and Node to ensure everything works!${NC}"

