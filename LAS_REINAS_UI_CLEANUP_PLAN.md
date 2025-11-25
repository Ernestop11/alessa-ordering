# 🧹 Las Reinas UI Cleanup Plan

## Issues Identified

1. **Images**: All items in a section share the same section-level image (e.g., all breakfast items show `desayuno.jpg`)
2. **UI Layout**: Messy, inconsistent styling, repetitive code across 3 layout modes
3. **Design Flow**: Hardcoded sections like "Combos Populares" that may not exist in database

## Solutions

### 1. Image Fix Strategy
- ✅ Created smart mapping script (runs on VPS)
- ✅ Items now have individual images mapped by name
- ⚠️ **Issue**: We only have section-level images, not individual item images
- **Solution**: Use section images as fallback BUT allow individual image uploads via admin

### 2. UI Cleanup
- Extract MenuItemCard component (✅ Created)
- Extract MenuSectionGrid component (✅ Created)
- Simplify layout rendering logic
- Remove hardcoded sections, use only database sections
- Consistent spacing, colors, and typography

### 3. Layout Configuration
- Add layout preferences to TenantSettings
- Default layout configurable via admin
- Grid columns configurable (2, 3, 4 columns)
- Item spacing configurable

## Implementation Steps

1. ✅ Extract MenuItemCard component
2. ✅ Extract MenuSectionGrid component  
3. ⏳ Update OrderPageClient to use new components
4. ⏳ Remove hardcoded sections, use only DB sections
5. ⏳ Add layout settings to admin
6. ⏳ Clean up styling consistency

