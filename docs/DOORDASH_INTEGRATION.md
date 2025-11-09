# DoorDash Drive API Integration

## ✅ Implementation Complete

The DoorDash Drive API has been successfully integrated with support for:
- **Delivery Quotes** - Get real-time delivery pricing
- **Create Deliveries** - Book deliveries with live tracking
- **Track Deliveries** - Monitor delivery status and dasher location
- **Mock/Sandbox/Production** - Automatic mode detection

---

## 📋 Files Modified

### API Routes
- `app/api/delivery/doordash/quote/route.ts` - Get delivery quotes
- `app/api/delivery/doordash/create/route.ts` - Create deliveries  
- `app/api/delivery/doordash/track/route.ts` - Track delivery status

### Configuration
- `.env.local` - Environment variables (created)

### Frontend
- `components/Cart.tsx` - Added deliveryQuoteId state

---

## 🚀 Quick Start

### 1. Add Credentials

Edit `.env.local`:
```bash
DOORDASH_API_KEY=your_api_key_here
DOORDASH_DEVELOPER_ID=your_developer_id_here
DOORDASH_SANDBOX=true
```

### 2. Start Server

```bash
npm run dev
```

### 3. Test Quote API

```bash
curl -X POST http://localhost:3000/api/delivery/doordash/quote \
  -H "Content-Type: application/json" \
  -H "Cookie: tenant=lapoblanita" \
  -d '{
    "pickupAddress": {"street": "123 Main St", "city": "SF", "state": "CA", "zipCode": "94102"},
    "dropoffAddress": {"street": "456 Market St", "city": "SF", "state": "CA", "zipCode": "94103"},
    "orderValue": 25.00
  }'
```

---

## 📡 API Endpoints

### Quote: `POST /api/delivery/doordash/quote`
Get delivery fee and ETA

### Create: `POST /api/delivery/doordash/create`
Book a delivery

### Track: `GET /api/delivery/doordash/track?deliveryId=xxx`
Get delivery status

---

## 🔄 Mode Detection

**Mock Mode** (no credentials)
- Returns simulated data
- `mode: "mock"` in response

**Sandbox Mode** (sandbox credentials + `DOORDASH_SANDBOX=true`)
- Calls DoorDash sandbox API
- No real charges
- `mode: "sandbox"` in response

**Production Mode** (production credentials + `DOORDASH_SANDBOX=false`)
- Real deliveries
- Real charges
- `mode: "production"` in response

---

## 📊 Response Examples

### Quote Response
```json
{
  "partner": "doordash",
  "deliveryFee": 8.49,
  "etaMinutes": 35,
  "quoteId": "quote_123",
  "mode": "sandbox"
}
```

### Create Response
```json
{
  "success": true,
  "deliveryId": "abc-123",
  "status": "pending",
  "trackingUrl": "https://track.doordash.com/abc-123",
  "dasher": {"name": "Jane", "phone": "+1..."},
  "mode": "sandbox"
}
```

---

## 🔧 Get DoorDash Credentials

1. Visit https://developer.doordash.com/
2. Sign up / Login
3. Create new app
4. Go to Credentials
5. Copy API Key + Developer ID

---

## ✅ Build Status

```bash
npm run build
# ✓ Compiled successfully
```

All TypeScript errors resolved!

---

**Status:** Production Ready  
**Last Updated:** 2025-01-08
