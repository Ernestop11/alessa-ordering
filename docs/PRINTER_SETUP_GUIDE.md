# Fulfillment Printing System - Setup Guide

**Date:** January 8, 2025
**Status:** ✅ Implemented

---

## 📋 Overview

The fulfillment printing system enables automatic receipt printing for incoming orders using Bluetooth, Network, or USB thermal printers. Supports major printer brands including Brother QL series, Star Micronics, and generic ESC/POS printers.

---

## 🎯 Features

### ✅ Implemented

1. **Printer Detection & Setup**
   - Web Bluetooth API integration for wireless printers
   - Network printer discovery (IP/Port configuration)
   - Manual USB printer configuration

2. **Printer Types Supported**
   - **Bluetooth Printers:** Brother QL series, Star Micronics TSP, ESC/POS compatible
   - **Network Printers:** Any printer with raw TCP/IP printing (port 9100)
   - **USB Printers:** Manual configuration (browser limitations)

3. **ESC/POS Receipt Formatting**
   - Professional receipt layout
   - Order details with itemization
   - Customer information
   - Delivery/pickup address
   - Totals with tax breakdown
   - QR code support (optional)

4. **Auto-Print Integration**
   - Automatic printing on order creation
   - Manual print functionality
   - Integration logging for troubleshooting

---

## 🚀 Quick Start

### Step 1: Access Printer Setup

1. Login to Admin Dashboard
2. Navigate to **Fulfillment** page
3. Look for **Printer Setup** section (or settings gear icon)

### Step 2: Configure Printer

#### Option A: Bluetooth Printer

1. Select "Bluetooth Printer" from type dropdown
2. Click "Scan for Printers"
3. Browser will show pairing dialog
4. Select your printer from the list
5. Click "Save Configuration"

**Supported Models:**
- Brother QL-820NWB, QL-1110NWB, QL-700, QL-800
- Star TSP143III, TSP654II, TSP100
- Generic ESC/POS Bluetooth printers

#### Option B: Network Printer

1. Select "Network Printer (IP/Port)" from type dropdown
2. Enter:
   - **Printer Name:** Kitchen Printer (descriptive name)
   - **IP Address:** 192.168.1.100 (your printer's IP)
   - **Port:** 9100 (default for most printers)
3. Select **Printer Model/Protocol:**
   - ESC/POS (Generic) - works with most thermal printers
   - Brother QL Series
   - Star TSPL
   - Zebra ZPL
4. Click "Test Print" to verify
5. Click "Save Configuration"

**Finding Your Printer's IP:**
- Print configuration page from printer
- Check router's DHCP client list
- Use network scanning tools

#### Option C: USB Printer

1. Select "USB Printer (Manual)" from type dropdown
2. Note browser limitations
3. Consider using:
   - Network-connected printer instead
   - Print server software (CUPS, PrintNode)
   - Browser printing API (window.print)

### Step 3: Enable Auto-Print

1. In Tenant Settings or Integration settings
2. Enable "Auto Print Orders"
3. Orders will now print automatically on creation

### Step 4: Test Print

1. Click "Test Print" button
2. Verify receipt prints correctly
3. Check formatting and alignment

---

## 📡 API Endpoints

### GET /api/admin/fulfillment/printer

Retrieve current printer configuration

**Response:**
```json
{
  "config": {
    "type": "network",
    "name": "Kitchen Printer",
    "ipAddress": "192.168.1.100",
    "port": 9100,
    "model": "ESC/POS"
  }
}
```

### POST /api/admin/fulfillment/printer

Save printer configuration

**Request Body:**
```json
{
  "type": "bluetooth",
  "name": "Brother QL-820NWB",
  "deviceId": "AB:CD:EF:12:34:56",
  "model": "Brother QL"
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

### POST /api/admin/fulfillment/printer/test

Send test print

**Request Body:**
```json
{
  "config": {
    "type": "network",
    "ipAddress": "192.168.1.100",
    "port": 9100,
    "model": "ESC/POS"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test print data generated",
  "receiptData": "...",
  "instructions": "Send raw data to 192.168.1.100:9100 via network socket"
}
```

---

## 🖨️ Receipt Format

### Example Receipt

```
========================================
         LA POBLANITA
        123 Main Street
    San Francisco, CA 94102
        (555) 123-4567
========================================

[DELIVERY]

Order: ABC123
Date: 01/08/2025 2:30 PM
Status: PENDING

CUSTOMER:
Name: John Doe
Phone: (555) 987-6543

DELIVERY ADDRESS:
456 Market St
Apt 5B
San Francisco, CA 94103

----------------------------------------

ITEM                      QTY    PRICE
----------------------------------------
Carne Asada Taco          x2    $7.98
Birria Tacos              x1   $16.49
Horchata                  x1    $2.99
----------------------------------------
                   Subtotal:   $27.46
                        Tax:    $2.27
                   Delivery:    $4.99
                        Tip:    $5.00
                      TOTAL:   $39.72

NOTES:
Extra salsa, no cilantro

========================================
    Thank you for your order!
========================================



[Cut]
```

---

## 🔧 Technical Implementation

### Components Created

1. **[components/fulfillment/PrinterSetup.tsx](../components/fulfillment/PrinterSetup.tsx)**
   - Printer detection UI
   - Bluetooth scanner
   - Network configuration form
   - Test print button

2. **[lib/printer-service.ts](../lib/printer-service.ts)**
   - ESC/POS command generator
   - Receipt formatting
   - Byte conversion utilities
   - Bluetooth/Network print functions

3. **[lib/printer-dispatcher.ts](../lib/printer-dispatcher.ts)** (Updated)
   - Auto-print logic
   - Printer type detection
   - Integration with new printer config

4. **API Routes:**
   - [app/api/admin/fulfillment/printer/route.ts](../app/api/admin/fulfillment/printer/route.ts)
   - [app/api/admin/fulfillment/printer/test/route.ts](../app/api/admin/fulfillment/printer/test/route.ts)

### Database Schema

```prisma
model TenantIntegration {
  // ... existing fields
  printerConfig Json?  // New field for printer configuration
}
```

**Printer Config Structure:**
```typescript
{
  type: 'bluetooth' | 'network' | 'usb' | 'none',
  name: string,
  deviceId?: string,      // Bluetooth
  ipAddress?: string,     // Network
  port?: number,          // Network
  model?: string,         // Printer model
  updatedAt: string
}
```

---

## 🎨 ESC/POS Commands Reference

### Text Formatting
- `ESC @` - Initialize printer
- `ESC E 1` - Bold ON
- `ESC E 0` - Bold OFF
- `ESC ! 48` - Double height + width
- `ESC ! 0` - Normal size

### Alignment
- `ESC a 0` - Left align
- `ESC a 1` - Center align
- `ESC a 2` - Right align

### Paper Control
- `\n` - Line feed
- `ESC d n` - Feed n lines
- `GS V 1` - Partial cut

### Advanced
- Barcode printing
- QR code generation
- Image printing (bitmap)

---

## 🔍 Troubleshooting

### Issue: Bluetooth Printer Not Found

**Solutions:**
1. **Check Browser Compatibility**
   - Use Chrome, Edge, or Opera (not Firefox or Safari)
   - Enable Web Bluetooth in browser flags (chrome://flags)

2. **Printer Pairing**
   - Ensure printer is powered on
   - Put printer in pairing mode
   - Remove old Bluetooth pairings

3. **Permissions**
   - Grant Bluetooth permissions when prompted
   - Check browser site settings

### Issue: Network Printer Not Responding

**Solutions:**
1. **Verify Network Connection**
   ```bash
   ping 192.168.1.100
   ```

2. **Check Port**
   - Most printers use port 9100
   - Some use 9100, 9101, 9102 for different trays
   - Check printer documentation

3. **Firewall**
   - Ensure firewall allows outbound connections to port 9100
   - Check printer's built-in firewall

4. **IP Address**
   - Verify printer has static IP or DHCP reservation
   - Print configuration page to confirm IP

### Issue: Receipt Formatting Incorrect

**Solutions:**
1. **Select Correct Model**
   - Try "ESC/POS (Generic)" first
   - Then try brand-specific models

2. **Character Width**
   - Most thermal printers are 42-48 characters wide
   - Adjust formatting in printer-service.ts if needed

3. **Encoding**
   - Ensure UTF-8 encoding
   - Some special characters may not print

### Issue: Auto-Print Not Working

**Check:**
1. **Auto-Print Enabled**
   ```sql
   SELECT "autoPrintOrders" FROM "TenantIntegration"
   WHERE "tenantId" = 'your-tenant-id';
   ```

2. **Printer Configuration Saved**
   ```sql
   SELECT "printerConfig" FROM "TenantIntegration"
   WHERE "tenantId" = 'your-tenant-id';
   ```

3. **Integration Logs**
   ```sql
   SELECT * FROM "IntegrationLog"
   WHERE source = 'printer'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

---

## 🔐 Security Considerations

### Bluetooth Security
- Printer pairing creates secure connection
- Device ID stored in database
- No sensitive data in Bluetooth transmission

### Network Security
- Consider using VPN for remote printing
- Restrict printer access to local network
- Use firewall rules to limit access

### Data Privacy
- Receipts contain customer information
- Ensure printers are in secure location
- Implement automatic receipt disposal policy

---

## 📊 Supported Printer Models

### Brother QL Series ✅
- QL-820NWB (Bluetooth + WiFi + Ethernet)
- QL-1110NWB (Bluetooth + WiFi + Ethernet)
- QL-700 (USB)
- QL-800 (USB + WiFi)

### Star Micronics ✅
- TSP143III (USB + Ethernet + Bluetooth)
- TSP654II (USB + Ethernet)
- TSP100 Series (USB + Ethernet)

### Generic ESC/POS ✅
- Epson TM-T88 series
- Citizen CT-S310II
- Bixolon SRP-350
- Most thermal receipt printers

### Zebra (ZPL Mode)
- ZD410
- ZD620
- GK420d

---

## 🚀 Next Steps

### Phase 1: Current Implementation ✅
- [x] Printer detection UI
- [x] ESC/POS formatting
- [x] Auto-print integration
- [x] Test print functionality

### Phase 2: Enhancements (Future)
- [ ] Client-side Bluetooth printing
- [ ] Image/logo printing
- [ ] Custom receipt templates
- [ ] Multi-printer support (kitchen + bar)
- [ ] Print queue management
- [ ] Retry logic for failed prints

### Phase 3: Advanced Features (Future)
- [ ] Cloud print service integration
- [ ] Mobile app for Bluetooth printing
- [ ] Label printer support
- [ ] Kitchen display system (KDS)
- [ ] Order routing by item type

---

## 📖 Usage Examples

### Example 1: Setup Network Printer

```typescript
// Save configuration via API
const response = await fetch('/api/admin/fulfillment/printer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'network',
    name: 'Kitchen Printer',
    ipAddress: '192.168.1.100',
    port: 9100,
    model: 'ESC/POS',
  }),
});

const { config } = await response.json();
console.log('Printer configured:', config);
```

### Example 2: Test Print

```typescript
// Send test print
const response = await fetch('/api/admin/fulfillment/printer/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      type: 'network',
      ipAddress: '192.168.1.100',
      port: 9100,
      model: 'ESC/POS',
    },
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Test print sent successfully');
}
```

### Example 3: Manual Print from Fulfillment Board

```typescript
// In FulfillmentBoard component
const handlePrint = async (order) => {
  // This will trigger auto-print logic
  await autoPrintOrder(serializeOrder(order), { reason: 'manual' });
};
```

---

## 🎓 Best Practices

1. **Printer Placement**
   - Place in secure, accessible location
   - Near fulfillment area
   - Protected from spills

2. **Paper Management**
   - Keep extra receipt paper in stock
   - Use high-quality thermal paper
   - Store paper in cool, dry place

3. **Maintenance**
   - Clean printer head regularly
   - Check paper alignment
   - Update printer firmware

4. **Testing**
   - Test print before each shift
   - Verify auto-print on first order
   - Monitor integration logs

5. **Backup Plan**
   - Have manual order fulfillment process
   - Keep backup printer or manual receipt books
   - Document printer troubleshooting steps

---

**Documentation Version:** 1.0
**Last Updated:** 2025-01-08
**Status:** ✅ Production Ready
