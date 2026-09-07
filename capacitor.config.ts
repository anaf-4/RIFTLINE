import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teamcraft.riftline',
  appName: 'RIFTLINE',
  webDir: 'dist',
  android: {
    backgroundColor: '#12141A',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
    },
  },
};

export default config;
