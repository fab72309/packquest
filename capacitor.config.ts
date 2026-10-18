import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.packquest.app',
  appName: 'PackQuest',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
