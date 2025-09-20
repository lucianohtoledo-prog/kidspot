import * as Location from 'expo-location';

const FALLBACK_LOCATION = { latitude: -23.55052, longitude: -46.633308 };
const LOCATION_TIMEOUT_MS = 15000;

async function getCurrentPositionWithinTimeout(): Promise<Location.LocationObject | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race<Location.LocationObject | null>([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<Location.LocationObject | null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function getUserLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ...FALLBACK_LOCATION };
    }

    const loc = await getCurrentPositionWithinTimeout();
    if (!loc) {
      console.info('Location lookup timed out; using fallback coordinates.');
      return { ...FALLBACK_LOCATION };
    }

    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (error) {
    console.info('Failed to resolve user location; using fallback.', error);
    return { ...FALLBACK_LOCATION };
  }
}