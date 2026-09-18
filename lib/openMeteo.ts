import { describeWeatherCode } from './weatherCodes';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  isDay: boolean;
  cape: number;
  humidity: number;
  pressure: number;
  visibility: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
  windGusts: number;
  cape: number;
}

export interface DailyPoint {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  windGustsMax: number;
  precipitationSum: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherReport {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export type NoticeLevel = 'info' | 'warning' | 'severe';

export interface WeatherNotice {
  id: string;
  level: NoticeLevel;
  title: string;
  message: string;
}

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'is_day',
  'cape',
  'relative_humidity_2m',
  'surface_pressure',
  'visibility',
].join(',');

const HOURLY_FIELDS = [
  'temperature_2m',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'cape',
].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'wind_gusts_10m_max',
  'precipitation_sum',
  'sunrise',
  'sunset',
].join(',');

export async function fetchWeatherReport(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<WeatherReport> {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', latitude.toFixed(4));
  url.searchParams.set('longitude', longitude.toFixed(4));
  url.searchParams.set('current', CURRENT_FIELDS);
  url.searchParams.set('hourly', HOURLY_FIELDS);
  url.searchParams.set('daily', DAILY_FIELDS);
  url.searchParams.set('forecast_days', '8');
  url.searchParams.set('wind_speed_unit', 'ms');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Kunde inte hämta väderdata (${response.status})`);
  }
  const data = await response.json();

  const current: CurrentWeather = {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    windGusts: data.current.wind_gusts_10m,
    windDirection: data.current.wind_direction_10m,
    isDay: data.current.is_day === 1,
    cape: data.current.cape ?? 0,
    humidity: data.current.relative_humidity_2m ?? 0,
    pressure: data.current.surface_pressure ?? 0,
    visibility: data.current.visibility ?? 0,
  };

  const hourlyTimes: string[] = data.hourly.time;
  const hourly: HourlyPoint[] = hourlyTimes.map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[i],
    precipitationProbability: data.hourly.precipitation_probability[i],
    weatherCode: data.hourly.weather_code[i],
    windSpeed: data.hourly.wind_speed_10m[i],
    windGusts: data.hourly.wind_gusts_10m[i],
    cape: data.hourly.cape?.[i] ?? 0,
  }));

  const dailyDates: string[] = data.daily.time;
  const daily: DailyPoint[] = dailyDates.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    windGustsMax: data.daily.wind_gusts_10m_max[i],
    precipitationSum: data.daily.precipitation_sum[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }));

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current,
    hourly,
    daily,
  };
}

export interface NoticeThresholds {
  windGustWarning: number;
  windGustSevere: number;
  thunderstormAlerts: boolean;
  lookAheadHours: number;
}

export const DEFAULT_THRESHOLDS: NoticeThresholds = {
  windGustWarning: 14, // m/s, ung. hård vind (Beaufort 7)
  windGustSevere: 21, // m/s, ung. storm (Beaufort 9-10)
  thunderstormAlerts: true,
  lookAheadHours: 6,
};

export function findFutureHours(hourly: HourlyPoint[], nowIso: string, hours: number): HourlyPoint[] {
  const nowTime = new Date(nowIso).getTime();
  return hourly
    .filter((h) => new Date(h.time).getTime() >= nowTime)
    .slice(0, hours);
}

/** Härleder korta, läsbara noteringar om åska och blåst för en plats. */
export function deriveNotices(
  report: WeatherReport,
  thresholds: NoticeThresholds = DEFAULT_THRESHOLDS
): WeatherNotice[] {
  const notices: WeatherNotice[] = [];
  const { current, hourly } = report;
  const currentInfo = describeWeatherCode(current.weatherCode);
  const upcoming = findFutureHours(hourly, current.time, thresholds.lookAheadHours);

  if (thresholds.thunderstormAlerts && currentInfo.isThunder) {
    notices.push({
      id: 'thunder-now',
      level: 'severe',
      title: 'Åska pågår',
      message: `${currentInfo.text} rapporteras just nu. Sök skydd inomhus vid behov.`,
    });
  } else if (thresholds.thunderstormAlerts) {
    const nextThunder = upcoming.find((h) => describeWeatherCode(h.weatherCode).isThunder);
    if (nextThunder) {
      const time = new Date(nextThunder.time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      notices.push({
        id: 'thunder-upcoming',
        level: 'warning',
        title: 'Åska väntas',
        message: `Åska kan väntas kring kl. ${time}.`,
      });
    } else if (current.cape >= 1000) {
      notices.push({
        id: 'thunder-risk',
        level: 'info',
        title: 'Åskrisk i atmosfären',
        message: 'Instabil luft (hög CAPE) kan ge åska senare under dagen.',
      });
    }
  }

  const severeThreshold = Math.max(thresholds.windGustSevere, thresholds.windGustWarning);
  if (current.windGusts >= severeThreshold) {
    notices.push({
      id: 'wind-severe',
      level: 'severe',
      title: 'Stormbyar',
      message: `Vindbyar upp mot ${Math.round(current.windGusts)} m/s just nu.`,
    });
  } else if (current.windGusts >= thresholds.windGustWarning) {
    notices.push({
      id: 'wind-warning',
      level: 'warning',
      title: 'Hård vind',
      message: `Kraftiga vindbyar, ${Math.round(current.windGusts)} m/s.`,
    });
  } else {
    const gustySoon = upcoming.find((h) => h.windGusts >= thresholds.windGustWarning);
    if (gustySoon) {
      const time = new Date(gustySoon.time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      notices.push({
        id: 'wind-upcoming',
        level: 'info',
        title: 'Hårdare vind på gång',
        message: `Vindbyar upp mot ${Math.round(gustySoon.windGusts)} m/s väntas kring kl. ${time}.`,
      });
    }
  }

  if (current.precipitation >= 4) {
    notices.push({
      id: 'rain-heavy',
      level: 'info',
      title: 'Kraftigt nederbörd',
      message: `${current.precipitation.toFixed(1)} mm/h just nu.`,
    });
  }

  return notices;
}

export function beaufortFromMs(speedMs: number): number {
  const scale = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
  for (let i = 0; i < scale.length; i++) {
    if (speedMs < scale[i]) return i;
  }
  return 12;
}

export function windDirectionLabel(deg: number): string {
  const labels = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSV', 'SV', 'VSV', 'V', 'VNV', 'NV', 'NNV'];
  const index = Math.round(deg / 22.5) % 16;
  return labels[index];
}
