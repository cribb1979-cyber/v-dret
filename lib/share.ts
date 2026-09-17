import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export interface ShareableLocation {
  name: string;
  latitude: number;
  longitude: number;
}

/** Bygger den bästa tillgängliga länken till en plats: en publik webblänk om appen är driftsatt, annars appens egen länk-schema. */
export function buildLocationLink({ name, latitude, longitude }: ShareableLocation): string {
  const path = '/';
  const params = {
    lat: latitude.toFixed(4),
    lon: longitude.toFixed(4),
    name,
  };

  const webBaseUrl = (Constants.expoConfig?.extra?.webBaseUrl as string) || '';
  if (webBaseUrl) {
    const url = new URL(webBaseUrl);
    url.pathname = path;
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  }

  return Linking.createURL(path, { queryParams: params });
}

export async function shareLocation(location: ShareableLocation): Promise<void> {
  const link = buildLocationLink(location);
  const message = `Se aktuellt väder, åska och blåst för ${location.name} i V-dret:\n${link}`;
  await Share.share({ message, url: link, title: `Väder för ${location.name}` });
}
