import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alessa.ordering',
  appName: 'Alessa Ordering',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Load fulfillment dashboard directly for kiosk mode
    // Will redirect to login if not authenticated, then back to fulfillment
    url: process.env.CAPACITOR_SERVER_URL || 'https://lasreinas.alessacloud.com/admin/fulfillment',
    cleartext: false,
  },
  ios: {
    scheme: 'alessa-ordering',
    contentInset: 'automatic',
    // Bluetooth permissions for iOS
    // These will be added to Info.plist automatically
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

