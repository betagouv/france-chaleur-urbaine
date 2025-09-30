#!/bin/bash -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# Cleanup function on exit
cleanup() {
    find public -name "*.tmp" -type f -delete 2>/dev/null || true
    rm -f "$TEMP_SAVINGS_FILE" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  IMAGE OPTIMIZATION SCRIPT${RESET}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Check if ImageMagick is installed
if ! command -v mogrify &> /dev/null; then
    echo -e "${RED}✗ Error: ImageMagick is not installed${RESET}"
    echo -e "  ${YELLOW}macOS:${RESET} brew install imagemagick"
    echo -e "  ${YELLOW}Linux:${RESET} apt-get install imagemagick"
    exit 1
fi

# Get last optimization timestamp
LAST_OPTIMIZE_FILE="src/modules/optimization/scripts/image-optimize-last-date.txt"
LAST_OPTIMIZE_TIME=""
if [ -f "$LAST_OPTIMIZE_FILE" ]; then
    LAST_OPTIMIZE_TIME=$(cat "$LAST_OPTIMIZE_FILE")
    echo -e "${BLUE}📅 Last optimization:${RESET} $LAST_OPTIMIZE_TIME"
fi

# Count files (only those modified since last optimization)
if [ -n "$LAST_OPTIMIZE_TIME" ]; then
    JPEG_COUNT=$(find public -type f \( -name "*.jpg" -o -name "*.jpeg" \) ! -name "*.pdf" -newer "$LAST_OPTIMIZE_FILE" 2>/dev/null | wc -l | tr -d ' ')
    PNG_COUNT=$(find public -type f -name "*.png" ! -name "*.pdf" -newer "$LAST_OPTIMIZE_FILE" 2>/dev/null | wc -l | tr -d ' ')
else
    JPEG_COUNT=$(find public -type f \( -name "*.jpg" -o -name "*.jpeg" \) ! -name "*.pdf" | wc -l | tr -d ' ')
    PNG_COUNT=$(find public -type f -name "*.png" ! -name "*.pdf" | wc -l | tr -d ' ')
fi

echo -e "${BLUE}🔍 Found:${RESET} ${BOLD}$JPEG_COUNT${RESET} JPEG files and ${BOLD}$PNG_COUNT${RESET} PNG files to optimize"
echo ""

# Initialize total savings
TOTAL_SAVED=0
TEMP_SAVINGS_FILE="/tmp/image-optimize-savings-$$.txt"
touch "$TEMP_SAVINGS_FILE"

# Function to optimize images
optimize_images() {
    local file_pattern="$1"
    local mogrify_opts="$2"
    local emoji="$3"
    local label="$4"

    echo -e "${YELLOW}${emoji} Optimizing ${label} files...${RESET}"

    FIND_CMD="find public -type f ${file_pattern} ! -name \"*.pdf\""
    if [ -n "$LAST_OPTIMIZE_TIME" ] && [ -f "$LAST_OPTIMIZE_FILE" ]; then
        FIND_CMD="$FIND_CMD -newer \"$LAST_OPTIMIZE_FILE\""
    fi

    eval "$FIND_CMD" | while IFS= read -r file; do
        ORIGINAL_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

        # Create temporary optimized version
        TEMP_FILE="${file}.tmp"
        cp "$file" "$TEMP_FILE"
        mogrify $mogrify_opts "$TEMP_FILE" 2>/dev/null
        NEW_SIZE=$(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE" 2>/dev/null)
        SAVED=$((ORIGINAL_SIZE - NEW_SIZE))

        if [ "$SAVED" -gt 0 ]; then
            PERCENT=$((SAVED * 100 / ORIGINAL_SIZE))
            echo -e "  ${GREEN}✓${RESET} $(basename "$file"): $(numfmt --to=iec $ORIGINAL_SIZE) → $(numfmt --to=iec $NEW_SIZE) ${GREEN}(saved ${PERCENT}%)${RESET}"
            mv "$TEMP_FILE" "$file"
            echo "$SAVED" >> "$TEMP_SAVINGS_FILE"
        else
            # No savings, just touch the file to update its modification time
            rm -f "$TEMP_FILE"
            touch -r "$LAST_OPTIMIZE_FILE" "$file"
        fi
    done
}

# Optimize JPEGs
if [ "$JPEG_COUNT" -gt 0 ]; then
    optimize_images '\( -name "*.jpg" -o -name "*.jpeg" \)' '-strip -interlace Plane -quality 92' '📸' 'JPEG'
fi

# Optimize PNGs
if [ "$PNG_COUNT" -gt 0 ]; then
    echo ""
    optimize_images '-name "*.png"' '-strip -define png:compression-level=9' '🖼️ ' 'PNG'
fi

# Calculate total savings
TOTAL_SAVED=$(awk '{sum+=$1} END {print sum}' "$TEMP_SAVINGS_FILE")
TOTAL_SAVED=${TOTAL_SAVED:-0}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
if [ "$TOTAL_SAVED" -gt 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Optimization complete!${RESET}"
    echo -e "${BOLD}💾 Total saved: ${GREEN}$(numfmt --to=iec $TOTAL_SAVED)${RESET}"
else
    echo -e "${YELLOW}✓ Optimization complete!${RESET}"
    echo -e "${BLUE}ℹ  No space saved (images already optimized)${RESET}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# Update last optimization timestamp
date > "$LAST_OPTIMIZE_FILE"
echo -e "${BLUE}📝 Timestamp saved in${RESET} $LAST_OPTIMIZE_FILE"
