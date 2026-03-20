import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streamking.app',
  appName: 'StreamKing',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow mixed-content (video iframes from various sources)
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
