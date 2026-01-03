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
    // IMPORTANT: Set CAPACITOR_SERVER_URL environment variable for your tenant
    // Example: CAPACITOR_SERVER_URL=https://lapoblanitamexicanfood.com/admin/fulfillment
    url: process.env.CAPACITOR_SERVER_URL,
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
      launchShowDuration: 0, // Don't auto-hide - let the web app hide it when ready
      launchAutoHide: false, // Manual control for better UX with remote content
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true, // Show spinner while loading remote content
      spinnerColor: '#3498db',
    },
  },
};

export default config;

