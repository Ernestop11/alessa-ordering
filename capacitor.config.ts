import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alessa.ordering',
  appName: 'Alessa Ordering',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Use the Las Reinas admin login page
    url: 'https://lasreinas.alessacloud.com/login',
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

