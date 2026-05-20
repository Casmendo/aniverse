import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aniverse.app',
  appName: 'AniVerse',
  webDir: 'out',
  server: {
    // Load the live Vercel site in the native WebView
    url: 'https://aniiverse.name.ng',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#06141B',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#06141B',
      showSpinner: false,
    },
  },
};

export default config;
