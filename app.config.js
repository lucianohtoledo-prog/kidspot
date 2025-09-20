// App config - reads keys from environment (EXPO_PUBLIC_*)
// For Google Maps keys on managed Expo, we set ios.config.googleMapsApiKey and android.config.googleMaps.apiKey
// Remember to create a .env file (see .env.example)
module.exports = ({ config }) => ({
  expo: {
    name: "KidSpot",
    slug: "kidspot",
    scheme: "kidspot",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      }
    },
    web: {
      bundler: "metro"
    },
    plugins: [
      // reanimated plugin is auto with SDK 51, but keeping for safety in babel
    ],
    extra: {
      demoMode: process.env.EXPO_PUBLIC_DEMO_MODE === "true",
      GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      FIREBASE: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
      }
    }
  }
});
