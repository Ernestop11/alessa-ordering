import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alessa.ordering',
  appName: 'Alessa Ordering',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, point to your local server:
    // url: 'http://localhost:3001',
    // cleartext: true,
    // For production, uncomment and set your production URL:
    // url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
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

