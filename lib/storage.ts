import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THRESHOLDS, NoticeThresholds } from './openMeteo';

const AREAS_KEY = 'vdret:areas:v1';
const SETTINGS_KEY = 'vdret:settings:v1';
const LAST_ALERT_KEY = 'vdret:lastAlerts:v1';

export interface Area {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: number;
}

export interface Settings extends NoticeThresholds {
  backgroundMonitoring: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_THRESHOLDS,
  backgroundMonitoring: false,
};

export async function getAreas(): Promise<Area[]> {
  const raw = await AsyncStorage.getItem(AREAS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Area[];
  } catch {
    return [];
  }
}

export async function saveAreas(areas: Area[]): Promise<void> {
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(areas));
}

export async function addArea(area: Omit<Area, 'id' | 'createdAt'>): Promise<Area> {
  const areas = await getAreas();
  const newArea: Area = {
    ...area,
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    createdAt: Date.now(),
  };
  await saveAreas([...areas, newArea]);
  return newArea;
}

export async function removeArea(id: string): Promise<void> {
  const areas = await getAreas();
  await saveAreas(areas.filter((a) => a.id !== id));
}

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Håller reda på senast aviserade notis-id per område, så vi inte spammar samma varning. */
export async function getLastAlertedNoticeIds(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(LAST_ALERT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

export async function setLastAlertedNoticeIds(map: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(LAST_ALERT_KEY, JSON.stringify(map));
}
