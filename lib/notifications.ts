import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { Platform } from 'react-native';
import { fetchWeatherReport, deriveNotices, WeatherNotice } from './openMeteo';
import {
  Area,
  getAreas,
  getSettings,
  getLastAlertedNoticeIds,
  setLastAlertedNoticeIds,
  effectiveThresholds,
  isQuietHoursActive,
} from './storage';

export const BACKGROUND_WEATHER_TASK = 'vdret-background-weather-check';
const ANDROID_CHANNEL_ID = 'weather-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Väder- och åskvarningar',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function notify(areaName: string, notice: WeatherNotice) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${notice.title} – ${areaName}`,
      body: notice.message,
      sound: notice.level === 'severe' ? 'default' : undefined,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

interface AreaCheckResult {
  area: Area;
  notices: WeatherNotice[];
}

async function checkArea(
  area: Area,
  settings: Awaited<ReturnType<typeof getSettings>>
): Promise<AreaCheckResult | null> {
  try {
    const report = await fetchWeatherReport(area.latitude, area.longitude);
    const thresholds = effectiveThresholds(settings, area);
    const notices = deriveNotices(report, thresholds).filter((n) => n.level !== 'info');
    return { area, notices };
  } catch (error) {
    console.warn(`V-dret: kunde inte kontrollera väder för ${area.name}`, error);
    return null;
  }
}

/** Kontrollerar alla sparade områden mot inställda tröskelvärden och aviserar vid nya varningar. */
export async function checkAreasAndNotify(): Promise<number> {
  const [areas, settings] = await Promise.all([getAreas(), getSettings()]);
  if (areas.length === 0) return 0;

  const lastAlerted = await getLastAlertedNoticeIds();
  const nextAlerted: Record<string, string[]> = { ...lastAlerted };
  const quiet = isQuietHoursActive(settings.quietHours);
  let sentCount = 0;

  // Hämtas parallellt istället för i tur och ordning, eftersom bakgrundskörning på
  // iOS/Android får ett strikt tidsfönster som annars kan ta slut innan sista området hunnits med.
  const results = await Promise.all(areas.map((area) => checkArea(area, settings)));

  for (const result of results) {
    if (!result) continue;
    const { area, notices } = result;
    const previouslySent = new Set(lastAlerted[area.id] ?? []);

    // Redan levererade varningar som fortfarande gäller ska förbli "kända" genom tysta
    // timmar, så de inte skickas på nytt bara för att tysta timmar tar slut.
    const stillDelivered = notices.filter((n) => previouslySent.has(n.id)).map((n) => n.id);
    const toDeliverNow = notices.filter(
      (n) => !previouslySent.has(n.id) && (!quiet || n.level === 'severe')
    );

    for (const notice of toDeliverNow) {
      await notify(area.name, notice);
      sentCount += 1;
    }

    nextAlerted[area.id] = [...stillDelivered, ...toDeliverNow.map((n) => n.id)];
  }

  await setLastAlertedNoticeIds(nextAlerted);
  return sentCount;
}

if (!TaskManager.isTaskDefined(BACKGROUND_WEATHER_TASK)) {
  TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
    try {
      await checkAreasAndNotify();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn('V-dret: bakgrundskontroll misslyckades', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundMonitoring(): Promise<void> {
  if (Platform.OS === 'web') return;
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
  if (registered) return;
  await BackgroundTask.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
    minimumInterval: 15, // minuter
  });
}

export async function unregisterBackgroundMonitoring(): Promise<void> {
  if (Platform.OS === 'web') return;
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
  if (!registered) return;
  await BackgroundTask.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
}
