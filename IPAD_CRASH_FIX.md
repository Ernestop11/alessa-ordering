# iPad App Crash Fix Guide

## 🔴 Problem Summary

Your app is crashing during installation/launch with these symptoms:
- Remote URL loading takes 19+ seconds
- WebView process becomes unresponsive
- App terminated with signal 9 (watchdog timeout)
- UIScene lifecycle warning (non-critical)

## ✅ Solution: Build Locally Instead of Remote URL

The app is currently configured to load from a remote URL (`https://lasreinas.alessacloud.com/login`), which is causing timeouts. For a production iPad app, you should bundle the web assets locally.

### Option 1: Build with Local Assets (Recommended)

1. **Build your Next.js app:**
   ```bash
   npm run build
   ```

2. **Update `capacitor.config.ts` to remove remote URL:**
   ```typescript
   // Comment out or remove the server.url line
   server: {
     androidScheme: 'https',
     iosScheme: 'https',
     // url: 'https://lasreinas.alessacloud.com/login', // Remove this
     cleartext: false,
   },
   ```

3. **Sync with Capacitor:**
   ```bash
   npm run build:ios
   # or
   npm run build && npx cap sync ios
   ```

4. **Open in Xcode and deploy:**
   ```bash
   npm run cap:ios
   ```

### Option 2: Keep Remote URL but Fix Network Issues

If you need to keep the remote URL for development:

1. **Check network connectivity on iPad:**
   - Ensure iPad has strong WiFi connection
   - Test URL in Safari: `https://lasreinas.alessacloud.com/login`
   - If it's slow in Safari, it will be slow in the app

2. **Add timeout configuration** (if supported by Capacitor):
   - Currently, Capacitor doesn't expose WebView timeout settings directly
   - Consider using a local build instead

3. **Check server response time:**
   ```bash
   curl -w "@-" -o /dev/null -s "https://lasreinas.alessacloud.com/login" <<'EOF'
   time_namelookup:  %{time_namelookup}\n
   time_connect:  %{time_connect}\n
   time_starttransfer:  %{time_starttransfer}\n
   time_total:  %{time_total}\n
   EOF
   ```

## 🔧 Quick Fix Steps

1. **Stop waiting** - The app has already crashed (signal 9)

2. **Build locally:**
   ```bash
   npm run build:ios
   ```

3. **Update capacitor.config.ts** - Remove or comment out the `server.url` line

4. **Re-sync:**
   ```bash
   npx cap sync ios
   ```

5. **Clean and rebuild in Xcode:**
   - Product → Clean Build Folder (Cmd+Shift+K)
   - Product → Run (Cmd+R)

## 📝 About the Warnings

### UIScene Lifecycle Warning
- **Status:** Non-critical, can be ignored
- **Why:** Capacitor uses UIApplication lifecycle, not UIScene
- **Action:** No action needed (this is expected for Capacitor apps)

### LLDB Shared Cache Warning
- **Status:** Performance warning only
- **Why:** Debugger can't find on-disk cache
- **Action:** No action needed (doesn't affect app functionality)

### Sandbox Extension Error
- **Status:** Usually harmless
- **Why:** iOS security restrictions
- **Action:** No action needed unless app fails to access files

## 🎯 Recommended Configuration

For production iPad deployment, use this `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alessa.ordering',
  appName: 'Alessa Ordering',
  webDir: 'public', // This will use the built Next.js app
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // No url = uses local bundled assets
    cleartext: false,
  },
  ios: {
    scheme: 'alessa-ordering',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
```

## 🚀 Deployment Workflow

1. **Make code changes** in your Next.js app
2. **Build:** `npm run build`
3. **Sync:** `npm run build:ios` (builds + syncs)
4. **Deploy:** Open Xcode and run on iPad

## ⚠️ Important Notes

- **Remote URLs are slow:** Loading from a remote URL adds network latency and can cause timeouts
- **Local builds are faster:** Bundled assets load instantly
- **Development vs Production:** Use remote URL only for quick testing, use local builds for deployment
- **Network dependency:** Remote URL requires constant internet connection

## 🐛 If Still Crashing

1. **Check iPad storage:** Free up at least 2GB
2. **Clean Xcode:** `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
3. **Reinstall pods:** `cd ios/App && pod install`
4. **Check device logs:** Use Console.app to see detailed errors
5. **Try on simulator first:** Test in iOS Simulator before physical device

