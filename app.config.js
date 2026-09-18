// Se https://docs.expo.dev/versions/v57.0.0/config/app/ för alla fält.
// Miljövariabler (valfria):
//   GOOGLE_MAPS_ANDROID_API_KEY - krävs för Google Maps-kartor i fristående Android-byggen
//   WEB_BASE_URL                - publik URL där webbversionen är driftsatt, används för delningslänkar
module.exports = ({ config }) => ({
  ...config,
  name: 'V-dret',
  slug: 'v-dret',
  version: '1.0.0',
  scheme: 'vdret',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'se.vdret.app',
    infoPlist: {
      UIBackgroundModes: ['fetch', 'location'],
      NSLocationWhenInUseUsageDescription:
        'V-dret behöver din plats för att visa aktuellt väder, åska och blåst där du är.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'V-dret kan bevaka väder i bakgrunden för att varna dig om åska och kraftig blåst kring din plats.',
    },
  },
  android: {
    package: 'se.vdret.app',
    adaptiveIcon: {
      backgroundColor: '#0B1E33',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || undefined,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'V-dret behöver din plats för att visa aktuellt väder, åska och blåst där du är.',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#1E6FD9',
      },
    ],
    'expo-task-manager',
    'expo-background-task',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#0B1E33',
      },
    ],
  ],
  extra: {
    ...(config.extra || {}),
    webBaseUrl: process.env.WEB_BASE_URL || '',
    eas: {
      projectId: 'd6bc072e-f6a7-4ae5-92da-57c5fef12531',
    },
  },
});
