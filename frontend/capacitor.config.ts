import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.casmendo.aniverse',
  appName: 'AniVerse',
  webDir: 'out',
  server: {
    // Load the live Vercel site in the native WebView
    url: 'https://aniiverse.name.ng',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'aniiverse.name.ng',
      'aniverse-orcin.vercel.app',
      'files.catbox.moe',
      '*.github.com',
      '*'
    ]
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
