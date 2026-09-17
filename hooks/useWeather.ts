import { useCallback, useEffect, useState } from 'react';
import { fetchWeatherReport, deriveNotices, WeatherReport, WeatherNotice, NoticeThresholds } from '../lib/openMeteo';

interface UseWeatherResult {
  report: WeatherReport | null;
  notices: WeatherNotice[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWeather(
  latitude: number | undefined,
  longitude: number | undefined,
  thresholds?: NoticeThresholds
): UseWeatherResult {
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchWeatherReport(latitude, longitude, controller.signal)
      .then(setReport)
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Kunde inte hämta väder');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [latitude, longitude, reloadToken]);

  const notices = report ? deriveNotices(report, thresholds) : [];

  return { report, notices, loading, error, refresh };
}
