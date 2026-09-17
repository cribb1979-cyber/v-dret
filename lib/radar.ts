// RainViewer publikt API för väderradar. https://www.rainviewer.com/api.html
const MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export interface RadarFrame {
  time: number; // unix seconds
  path: string;
}

export interface RadarData {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[];
}

export async function fetchRadarData(signal?: AbortSignal): Promise<RadarData> {
  const response = await fetch(MAPS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Kunde inte hämta radardata (${response.status})`);
  }
  const data = await response.json();
  return {
    host: data.host,
    past: data.radar?.past ?? [],
    nowcast: data.radar?.nowcast ?? [],
  };
}

/**
 * Bygger en tile-URL-mall för en radarbild.
 * size: 256|512, color: 0-8 (färgschema), options: t.ex. "1_1" (utjämning_snö).
 */
export function radarTileUrlTemplate(
  host: string,
  frame: RadarFrame,
  { size = 256, color = 4, smooth = 1, snow = 1 }: { size?: 256 | 512; color?: number; smooth?: 0 | 1; snow?: 0 | 1 } = {}
): string {
  return `${host}${frame.path}/${size}/{z}/{x}/{y}/${color}/${smooth}_${snow}.png`;
}

export function formatFrameTime(frame: RadarFrame): string {
  return new Date(frame.time * 1000).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
