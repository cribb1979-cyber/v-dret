import * as Location from 'expo-location';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Platsbehörighet nekades. Tillåt plats i inställningarna för att se väder där du är.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  let name = 'Min plats';
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (place) {
      name = place.city || place.subregion || place.region || name;
    }
  } catch {
    // Reverse-geokodning saknas på vissa plattformar (t.ex. webben) – behåll fallback-namnet.
  }

  return { latitude, longitude, name };
}
