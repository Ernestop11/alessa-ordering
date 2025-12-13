# Operating Hours System - Permanent Documentation

## Overview

The operating hours system provides comprehensive control over when customers can place orders, with real-time sync between admin controls and customer-facing UI.

## Admin Controls

### 1. Menu Editor Toggle
**Location**: Menu Editor header (next to "Menu Editor" title)

**Features**:
- One-click toggle to open/close ordering
- Real-time visual indicator:
  - **Green badge** = "Accepting Orders" (open)
  - **Red badge** = "Orders Closed" (closed)
- Changes reflect immediately on frontend (normal refresh)

### 2. Settings Page
**Location**: Admin → Settings → Operating Status

**Controls**:
- **Accepting Orders** (green checkbox)
  - Master on/off switch
  - Respects operating hours when enabled
  - Automatically unchecks when "Temporary Closure" is enabled

- **Temporary Closure** (red checkbox)
  - Override everything - closes ordering immediately
  - Automatically turns off "Accepting Orders" when enabled
  - Includes custom closure message field
  - Highest priority (overrides all other settings)

- **Timezone Selector**
  - Set restaurant's timezone for accurate hours validation

- **Holiday Closures**
  - Add specific dates when closed
  - Each holiday has date picker + name
  - Overrides regular operating hours

- **Regular Operating Hours**
  - Set hours for each day of the week
  - Mark specific days as closed
  - Set open/close times per day

## Frontend Behavior

### Customer Experience

**When Restaurant is OPEN**:
- Hero banner: Dark red background (`#6B1C1C`)
- Message: `🎉 Order online for pickup or delivery`
- Shows operating hours
- "Add to Cart" buttons enabled

**When Restaurant is CLOSED**:
- Hero banner: Bright red background (`#dc2626`)
- Message: `🚫 [Your custom closure message]`
- Falls back to "Ordering is currently closed" if no message
- Shows operating hours
- "Add to Cart" buttons disabled
- Shows notification when trying to add items

## Validation Priority (Highest to Lowest)

1. **Temporary Closure** - Overrides everything
2. **isOpen Flag** - Master on/off switch
3. **Holiday Closures** - Date-specific closures
4. **Regular Operating Hours** - Day/time validation

## Technical Implementation

### State Management

**Menu Editor**:
```typescript
const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
const [loadingStatus, setLoadingStatus] = useState(false);
```

**Settings Page**:
```typescript
const [isOpen, setIsOpen] = useState(true);
const [temporarilyClosed, setTemporarilyClosed] = useState(false);
const [closedMessage, setClosedMessage] = useState('');
const [holidays, setHolidays] = useState([]);
const [timezone, setTimezone] = useState('America/Los_Angeles');
const [hours, setHours] = useState({});
```

### API Integration

**Endpoint**: `PUT /api/admin/tenant-settings`

**Payload Structure**:
```json
{
  "isOpen": true,
  "operatingHours": {
    "timezone": "America/Los_Angeles",
    "storeHours": {
      "monday": { "open": "09:00", "close": "21:00", "closed": false },
      "tuesday": { "open": "09:00", "close": "21:00", "closed": false }
      // ... other days
    },
    "temporarilyClosed": false,
    "closedMessage": "We are temporarily closed. Check back soon!",
    "holidays": [
      { "id": "holiday-123", "date": "2025-12-25", "name": "Christmas Day" }
    ]
  }
}
```

### Validation Logic

**File**: `lib/hours-validator.ts`

**Function**: `validateOperatingHours(operatingHours, isOpenFlag, currentDate)`

**Returns**:
```typescript
{
  isOpen: boolean;
  reason?: string;
  message?: string;
  nextOpenTime?: string;
}
```

### Auto-Sync System

**Cache Control**:
- Service Worker skips caching `/order`, `/admin`, `/checkout`
- Middleware sets no-cache headers for dynamic pages
- `revalidatePath()` called after settings updates

**Result**: Normal refresh (Cmd+R) shows changes immediately!

## Important Notes

### Mutually Exclusive Toggles
- **"Accepting Orders"** and **"Temporary Closure"** are mutually exclusive
- Checking one automatically unchecks the other
- This prevents confusion about restaurant status

### Operating Hours Merging
- When toggling in Menu Editor, existing hours are preserved
- System fetches current settings first, then merges
- Prevents accidental deletion of configured hours

### Frontend Message Display
- Only ONE closure message shows (in promotional banner)
- No duplicate banners
- Clean, non-intrusive UX

## Files Modified

### Admin Components
- `components/admin/SettingsPage.tsx` - Full settings UI
- `components/admin/MenuEditorPage.tsx` - Quick toggle in header

### Frontend Components
- `components/order/OrderPageClient.tsx` - Dynamic hero banner

### Backend
- `app/api/admin/tenant-settings/route.ts` - Settings API
- `app/order/page.tsx` - Server-side validation

### Utilities
- `lib/hours-validator.ts` - Validation logic
- `middleware.ts` - Cache control headers
- `public/service-worker.js` - Skip caching for dynamic pages

## Testing Checklist

- [ ] Toggle in Menu Editor works both ways (ON/OFF)
- [ ] Settings page toggles are mutually exclusive
- [ ] Frontend message changes based on status
- [ ] Hero banner color changes (dark red → bright red)
- [ ] "Add to Cart" buttons are disabled when closed
- [ ] Custom closure message displays correctly
- [ ] Normal refresh (Cmd+R) shows changes immediately
- [ ] Operating hours are preserved when toggling
- [ ] Holiday closures override regular hours
- [ ] Temporary closure overrides everything

## Support

For issues or questions about the operating hours system:
1. Check this documentation first
2. Review validation logic in `lib/hours-validator.ts`
3. Check admin settings in database: `TenantSettings.operatingHours` and `TenantSettings.isOpen`

---

**Last Updated**: 2025-12-13
**Status**: ✅ Production-ready
**Auto-Sync**: ✅ Enabled
