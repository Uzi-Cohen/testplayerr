import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.streamking.app',
  appName: 'StreamKing',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    // Allows the WebView to load the VidKing iframes (mixed HTTP/HTTPS)
  },
  server: {
    // Remove this block if you want a fully offline/bundled APK.
    // Keep it during development to get live-reload on device.
    // androidScheme: 'https',
  },
}

export default config
