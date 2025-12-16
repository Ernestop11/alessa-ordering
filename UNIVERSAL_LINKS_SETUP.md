# Universal Links Setup Guide

This guide will help you complete the Universal Links configuration so your iOS app opens URLs natively instead of in Safari.

## Step 1: Get Your Apple Developer Team ID

You need to find your Apple Developer Team ID to complete the configuration.

### Option A: From Xcode
1. Open Xcode
2. Go to **Xcode → Preferences** (or **Settings** on newer versions)
3. Click on **Accounts** tab
4. Select your Apple ID
5. Select your team
6. Your **Team ID** is shown next to your team name (format: `ABC123DEF4`)

### Option B: From Apple Developer Portal
1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID
3. Click on **Membership** in the sidebar
4. Your **Team ID** is displayed at the top (format: `ABC123DEF4`)

### Option C: From Your App's Bundle Identifier
If you've already built the app, you can find it in:
- Xcode → Your App Target → General → Signing & Capabilities
- Look for the Team ID in the signing certificate

## Step 2: Update the Configuration

Once you have your Team ID, update these files:

### Update Environment Variable (Recommended)
Add to your `.env` file:
```bash
APPLE_TEAM_ID=YOUR_TEAM_ID_HERE
```

### Or Update the Files Directly

**File 1:** `app/.well-known/apple-app-site-association/route.ts`
Replace `TEAM_ID` with your actual Team ID:
```typescript
const teamId = process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID_HERE';
```

**File 2:** `public/.well-known/apple-app-site-association`
Replace `TEAM_ID` with your actual Team ID:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID_HERE.com.alessa.ordering",
        ...
      }
    ]
  }
}
```

## Step 3: Verify the File is Accessible

After deploying, verify the file is accessible:

1. **Test locally:**
   ```bash
   curl http://localhost:3000/.well-known/apple-app-site-association
   ```

2. **Test on production:**
   ```bash
   curl https://alessacloud.com/.well-known/apple-app-site-association
   curl https://lasreinas.alessacloud.com/.well-known/apple-app-site-association
   ```

The response should be JSON with your Team ID and app ID.

## Step 4: Configure Xcode (If Not Done Already)

1. Open your project in Xcode: `ios/App/App.xcworkspace`
2. Select your app target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **Associated Domains**
6. Add these domains:
   - `applinks:alessacloud.com`
   - `applinks:*.alessacloud.com`

## Step 5: Rebuild and Test

### Clean Build
1. In Xcode: **Product → Clean Build Folder** (Shift+Cmd+K)
2. Close and reopen Xcode

### Rebuild
1. In Xcode: **Product → Archive**
2. Upload to TestFlight
3. Install on a test device

### Test Universal Links
1. On your iOS device, open Notes app
2. Type: `https://lasreinas.alessacloud.com/admin/fulfillment`
3. Long press the link
4. You should see "Open in Alessa Ordering" option
5. Tap it - it should open in your app, not Safari

## Troubleshooting

### Links Still Open in Safari

1. **Check Team ID is correct:**
   - Verify the Team ID in the association file matches your Apple Developer account
   - Format should be: `ABC123DEF4.com.alessa.ordering`

2. **Check file is accessible:**
   ```bash
   curl -I https://alessacloud.com/.well-known/apple-app-site-association
   ```
   Should return `Content-Type: application/json`

3. **Check Associated Domains in Xcode:**
   - Make sure domains are added in Signing & Capabilities
   - Format: `applinks:alessacloud.com` (no https://)

4. **Clear iOS cache:**
   - Delete the app from device
   - Reinstall from TestFlight
   - iOS caches the association file

5. **Verify HTTPS:**
   - Universal Links only work over HTTPS
   - Make sure your domain has a valid SSL certificate

### File Not Found (404)

If the file returns 404:
1. Make sure the API route is deployed: `app/.well-known/apple-app-site-association/route.ts`
2. Check Next.js is serving the route correctly
3. Verify the file path is exactly: `/.well-known/apple-app-site-association` (no extension)

### Wrong Content-Type

The file must be served as `application/json`, not `text/plain`. The API route handles this automatically.

## Verification Checklist

- [ ] Team ID added to `.env` or files
- [ ] File accessible at `https://alessacloud.com/.well-known/apple-app-site-association`
- [ ] File returns JSON with correct Team ID
- [ ] Associated Domains added in Xcode
- [ ] App rebuilt and uploaded to TestFlight
- [ ] Tested on device - links open in app

## Additional Resources

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Apple App Site Association File Format](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app#create-the-apple-app-site-association-file)

