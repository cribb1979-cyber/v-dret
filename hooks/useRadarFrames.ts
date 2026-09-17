import { useEffect, useState } from 'react';
import { fetchRadarData, RadarData } from '../lib/radar';

export function useRadarFrames() {
  const [data, setData] = useState<RadarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchRadarData(controller.signal)
      .then((d) => {
        setData(d);
        setFrameIndex(Math.max(0, d.past.length - 1));
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError('Kunde inte hämta radardata');
      });
    return () => controller.abort();
  }, []);

  const frames = data?.past ?? [];
  const frame = frames[frameIndex];

  return { host: data?.host, frames, frame, frameIndex, setFrameIndex, error };
}
