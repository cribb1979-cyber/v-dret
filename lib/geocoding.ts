const SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface PlaceResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(SEARCH_URL);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'sv');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Sökningen misslyckades (${response.status})`);
  }
  const data = await response.json();
  const results = (data.results ?? []) as any[];
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }));
}
