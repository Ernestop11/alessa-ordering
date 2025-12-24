#!/bin/bash

# Free Disk Space Script for macOS iOS Development
# Moves large developer folders to external drive and creates symlinks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# External drive mount point (update this if different)
EXTERNAL_DRIVE="/Volumes/AlessaCloud"
BACKUP_DIR="$EXTERNAL_DRIVE/DeveloperBackup"

echo -e "${BLUE}=== Disk Space Analysis ===${NC}\n"

# Step 1: Check external drive is mounted
echo -e "${YELLOW}Step 1: Checking external drive...${NC}"
if [ ! -d "$EXTERNAL_DRIVE" ]; then
    echo -e "${RED}ERROR: External drive not found at $EXTERNAL_DRIVE${NC}"
    echo "Please mount the drive and update EXTERNAL_DRIVE path if needed"
    exit 1
fi
echo -e "${GREEN}✓ External drive found at $EXTERNAL_DRIVE${NC}\n"

# Step 2: Analyze current disk usage
echo -e "${YELLOW}Step 2: Analyzing disk usage...${NC}\n"

echo -e "${BLUE}--- Home directory size ---${NC}"
du -sh ~ 2>/dev/null | head -1

echo -e "\n${BLUE}--- Target folders analysis ---${NC}"

# Function to check folder size
check_folder() {
    local folder=$1
    if [ -d "$folder" ]; then
        local size=$(du -sh "$folder" 2>/dev/null | cut -f1)
        local size_bytes=$(du -sk "$folder" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✓${NC} $folder: ${YELLOW}$size${NC} (${size_bytes}KB)"
    else
        echo -e "${RED}✗${NC} $folder: ${RED}Not found${NC}"
    fi
}

# Check target folders
check_folder ~/Library/Developer/Xcode/DerivedData
check_folder ~/Library/Developer/Xcode/iOS\ DeviceSupport
check_folder ~/Library/Caches
check_folder ~/.npm
check_folder ~/.node_modules
check_folder ~/Library/Developer/Xcode/Archives
check_folder ~/Library/Developer/CoreSimulator

# Check for large Node projects
echo -e "\n${BLUE}--- Large Node projects (node_modules > 100MB) ---${NC}"
find ~ -type d -name "node_modules" -prune -exec du -sh {} \; 2>/dev/null | \
    awk '$1 ~ /[0-9]+[MG]/ {print}' | \
    sort -hr | \
    head -10

# Check for large build artifacts
echo -e "\n${BLUE}--- Large build artifacts ---${NC}"
find ~/Library/Developer/Xcode/DerivedData -type d -maxdepth 1 2>/dev/null | \
    xargs -I {} du -sh {} 2>/dev/null | \
    sort -hr | \
    head -5

# Calculate total space to be freed
echo -e "\n${BLUE}--- Space calculation ---${NC}"
TOTAL_SIZE=0

calculate_size() {
    local folder=$1
    if [ -d "$folder" ]; then
        local size_kb=$(du -sk "$folder" 2>/dev/null | cut -f1)
        TOTAL_SIZE=$((TOTAL_SIZE + size_kb))
    fi
}

calculate_size ~/Library/Developer/Xcode/DerivedData
calculate_size ~/Library/Developer/Xcode/iOS\ DeviceSupport
calculate_size ~/Library/Caches
calculate_size ~/.npm

TOTAL_GB=$((TOTAL_SIZE / 1024 / 1024))
echo -e "${GREEN}Estimated space to free: ~${TOTAL_GB}GB${NC}\n"

# Check available space on external drive
echo -e "${BLUE}--- External drive space ---${NC}"
df -h "$EXTERNAL_DRIVE" | tail -1 | awk '{print "Available: " $4 " of " $2 " (" $5 " used)"}'

echo -e "\n${YELLOW}=== Analysis Complete ===${NC}"
echo -e "Review the sizes above. If ready to proceed, run the migration commands."


















