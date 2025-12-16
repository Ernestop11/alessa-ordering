# 🚀 TestFlight Quick Start

## One-Command Deployment

Run this single command to prepare everything:

```bash
./scripts/testflight-deploy.sh
```

This will:
1. ✅ Check all prerequisites
2. ✅ Update version/build numbers automatically
3. ✅ Build Next.js app
4. ✅ Sync Capacitor
5. ✅ Update CocoaPods
6. ✅ Open Xcode for you

Then in Xcode:
1. Select **"Any iOS Device"** (not your iPad!)
2. **Product → Archive**
3. **Distribute App → App Store Connect**

---

## Manual Version Control

If you want to specify version/build:

```bash
./scripts/testflight-deploy.sh 1.0.1 5
```

This sets version to `1.0.1` and build to `5`.

---

## Check Prerequisites Only

Before deploying, check everything is ready:

```bash
./scripts/check-testflight-prerequisites.sh
```

---

## Update Version Only

Just update version/build numbers:

```bash
./scripts/update-version.sh 1.0.1 2
```

Or auto-increment:
```bash
./scripts/update-version.sh
```

---

## Current Project Status

- **Version**: 1.0
- **Build**: 1
- **Bundle ID**: com.alessa.ordering
- **Server URL**: https://lasreinas.alessacloud.com

---

## What Happens After Upload

1. **Upload** (10-20 minutes)
   - Xcode uploads to App Store Connect
   - You'll see progress in Xcode

2. **Processing** (10-30 minutes)
   - Apple processes your build
   - Check App Store Connect → TestFlight tab

3. **Ready for Testing**
   - Green checkmark appears
   - Add testers
   - Send invitations

4. **Install on iPad**
   - Install TestFlight app
   - Accept invitation
   - Install Alessa Ordering

---

## Troubleshooting

### Archive Button Grayed Out
- **Fix**: Select "Any iOS Device" (not your iPad)

### Signing Errors
- **Fix**: Xcode → Settings → Accounts → Add Apple ID
- **Fix**: Xcode → Signing & Capabilities → Select Team

### Upload Fails
- **Check**: Internet connection
- **Check**: Bundle ID matches: `com.alessa.ordering`
- **Check**: Version/build numbers are unique

### Processing Stuck
- **Wait**: First build can take 30+ minutes
- **Check**: App Store Connect → Activity tab
- **Contact**: Apple Support if > 2 hours

---

## Full Documentation

- **Complete Guide**: `TESTFLIGHT_DEPLOYMENT_GUIDE.md`
- **Fixes Summary**: `DEPLOYMENT_FIXES_SUMMARY.md`
- **Kiosk Setup**: `IPAD_KIOSK_SETUP.md`

---

**Ready? Run:** `./scripts/testflight-deploy.sh` 🚀

