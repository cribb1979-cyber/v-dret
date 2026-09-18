import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THRESHOLDS, NoticeThresholds } from './openMeteo';

const AREAS_KEY = 'vdret:areas:v1';
const SETTINGS_KEY = 'vdret:settings:v1';
const LAST_ALERT_KEY = 'vdret:lastAlerts:v1';

export type AreaType = 'hem' | 'arbete' | 'fritidshus' | 'annan';

export const AREA_TYPES: { value: AreaType; label: string; emoji: string }[] = [
  { value: 'hem', label: 'Hem', emoji: '🏠' },
  { value: 'arbete', label: 'Arbete', emoji: '💼' },
  { value: 'fritidshus', label: 'Fritidshus', emoji: '🏡' },
  { value: 'annan', label: 'Annan', emoji: '📍' },
];

export interface AreaAlertOverrides {
  windGustWarning?: number;
  thunderstormAlerts?: boolean;
}

export interface Area {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: number;
  type: AreaType;
  alertOverrides?: AreaAlertOverrides;
}

export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23, lokal tid
  endHour: number; // 0-23, lokal tid
}

export interface Settings extends NoticeThresholds {
  backgroundMonitoring: boolean;
  quietHours: QuietHours;
}

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_THRESHOLDS,
  backgroundMonitoring: false,
  quietHours: { enabled: false, startHour: 22, endHour: 7 },
};

/** Slår ihop globala inställningar med ett områdes egna trösklar (om satta). */
export function effectiveThresholds(settings: NoticeThresholds, area: Pick<Area, 'alertOverrides'>): NoticeThresholds {
  return { ...settings, ...(area.alertOverrides ?? {}) };
}

/** Sant om klockslaget (lokal tid) ligger inom de tysta timmarna, även när intervallet passerar midnatt. */
export function isQuietHoursActive(quietHours: QuietHours, at: Date = new Date()): boolean {
  if (!quietHours.enabled) return false;
  const hour = at.getHours();
  const { startHour, endHour } = quietHours;
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

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

export async function addArea(
  area: Omit<Area, 'id' | 'createdAt' | 'type'> & { type?: AreaType }
): Promise<Area> {
  const areas = await getAreas();
  const newArea: Area = {
    type: 'annan',
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

export async function updateArea(id: string, patch: Partial<Omit<Area, 'id' | 'createdAt'>>): Promise<void> {
  const areas = await getAreas();
  await saveAreas(areas.map((a) => (a.id === id ? { ...a, ...patch } : a)));
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
