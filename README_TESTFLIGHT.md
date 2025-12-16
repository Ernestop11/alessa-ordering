# 📱 TestFlight Deployment - Complete Guide

## 🎯 What You Need

✅ **All prerequisites are met!** (Verified automatically)

- Xcode 26.2 ✅
- CocoaPods 1.16.2 ✅
- Node.js v22.18.0 ✅
- Code signing certificates ✅
- Project configured correctly ✅

---

## 🚀 Quick Start (Recommended)

### One Command Does Everything

```bash
./scripts/testflight-deploy.sh
```

This single command:
1. ✅ Checks all prerequisites
2. ✅ Updates version/build automatically
3. ✅ Builds your Next.js app
4. ✅ Syncs Capacitor
5. ✅ Updates CocoaPods
6. ✅ Opens Xcode ready for archiving

**Then just archive and upload in Xcode!**

---

## 📋 Step-by-Step Guide

### Phase 1: Preparation (Automated)

```bash
# Run the deployment script
./scripts/testflight-deploy.sh
```

**What it does:**
- Verifies all tools are installed
- Updates version from 1.0 → 1.0.1 (auto-increment)
- Updates build from 1 → 2 (auto-increment)
- Builds Next.js production bundle
- Syncs to iOS project
- Updates CocoaPods dependencies
- Opens Xcode

**Time**: ~5 minutes

---

### Phase 2: Archive in Xcode (Manual)

1. **Select Device**
   - In Xcode toolbar, click device dropdown
   - Select **"Any iOS Device"** ⚠️ (NOT your iPad!)

2. **Archive**
   - **Product → Archive**
   - Wait 5-10 minutes for build

3. **Organizer Opens**
   - Xcode automatically opens Organizer
   - Your archive appears in list

**Time**: ~10 minutes

---

### Phase 3: Upload (Manual)

1. **Distribute**
   - In Organizer, click **"Distribute App"**
   - Select **"App Store Connect"**
   - Click **"Next"**

2. **Upload Options**
   - Select **"Upload"**
   - Click **"Next"**
   - Review options (keep defaults)
   - Click **"Upload"**

3. **Wait**
   - Upload progress shown in Xcode
   - Takes 10-20 minutes
   - Click **"Done"** when complete

**Time**: ~15 minutes

---

### Phase 4: TestFlight Setup (Web)

1. **App Store Connect**
   - Go to: https://appstoreconnect.apple.com
   - Log in with Apple ID
   - Click **"My Apps"**
   - Select **"Alessa Ordering"**

2. **Wait for Processing**
   - Go to **"TestFlight"** tab
   - Find your build
   - Wait for processing (10-30 minutes)
   - Green checkmark ✅ when ready

3. **Add Testers**
   - Go to **"Internal Testing"**
   - Click **"+"** → Add your email
   - Click **"Start Testing"**

**Time**: ~30 minutes (mostly waiting)

---

### Phase 5: Install on iPad

1. **Install TestFlight**
   - App Store → Search "TestFlight" → Install

2. **Accept Invitation**
   - Check email → Tap "View in TestFlight"
   - Tap **"Accept"** → **"Install"**

3. **Test App**
   - Open Alessa Ordering
   - Verify it works
   - Set up kiosk mode (see `IPAD_KIOSK_SETUP.md`)

**Time**: ~5 minutes

---

## 📊 Total Time Estimate

- **Preparation**: 5 minutes (automated)
- **Archive**: 10 minutes
- **Upload**: 15 minutes
- **Processing**: 30 minutes (waiting)
- **Setup**: 5 minutes

**Total**: ~65 minutes (mostly waiting)

---

## 🔧 Advanced Options

### Custom Version/Build

```bash
./scripts/testflight-deploy.sh 1.0.1 5
```

Sets version to `1.0.1` and build to `5`.

### Just Check Prerequisites

```bash
./scripts/check-testflight-prerequisites.sh
```

### Just Update Version

```bash
./scripts/update-version.sh 1.0.1 2
```

---

## 📚 Documentation

- **Quick Start**: `TESTFLIGHT_QUICK_START.md`
- **Complete Guide**: `TESTFLIGHT_DEPLOYMENT_GUIDE.md`
- **Checklist**: `TESTFLIGHT_CHECKLIST.md`
- **Fixes Summary**: `DEPLOYMENT_FIXES_SUMMARY.md`
- **Kiosk Setup**: `IPAD_KIOSK_SETUP.md`

---

## 🎯 Current Status

✅ **Ready to Deploy!**

- All prerequisites met
- Project configured correctly
- Scripts ready to use
- Code signing set up

**Next Step**: Run `./scripts/testflight-deploy.sh` 🚀

---

## 💡 Pro Tips

1. **First Time**: Allow extra time for App Store Connect setup
2. **Updates**: Subsequent builds are faster (no re-setup needed)
3. **Testers**: Internal testers get instant updates
4. **External**: External testers require 24-48hr review (first time)
5. **Versioning**: Always increment build number for each upload

---

## 🆘 Need Help?

- **Prerequisites**: `./scripts/check-testflight-prerequisites.sh`
- **Troubleshooting**: See `TESTFLIGHT_DEPLOYMENT_GUIDE.md`
- **Apple Support**: https://developer.apple.com/support

---

**Ready? Let's deploy!** 🚀

```bash
./scripts/testflight-deploy.sh
```

