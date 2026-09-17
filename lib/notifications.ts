import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { fetchWeatherReport, deriveNotices, WeatherNotice } from './openMeteo';
import { getAreas, getSettings, getLastAlertedNoticeIds, setLastAlertedNoticeIds } from './storage';

export const BACKGROUND_WEATHER_TASK = 'vdret-background-weather-check';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
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
    },
    trigger: null,
  });
}

/** Kontrollerar alla sparade områden mot inställda tröskelvärden och aviserar vid nya varningar. */
export async function checkAreasAndNotify(): Promise<number> {
  const [areas, settings] = await Promise.all([getAreas(), getSettings()]);
  if (areas.length === 0) return 0;

  const lastAlerted = await getLastAlertedNoticeIds();
  const nextAlerted: Record<string, string[]> = { ...lastAlerted };
  let sentCount = 0;

  for (const area of areas) {
    try {
      const report = await fetchWeatherReport(area.latitude, area.longitude);
      const notices = deriveNotices(report, settings).filter((n) => n.level !== 'info');
      const previouslySent = new Set(lastAlerted[area.id] ?? []);
      const currentIds = notices.map((n) => n.id);

      for (const notice of notices) {
        if (!previouslySent.has(notice.id)) {
          await notify(area.name, notice);
          sentCount += 1;
        }
      }
      nextAlerted[area.id] = currentIds;
    } catch (error) {
      console.warn(`V-dret: kunde inte kontrollera väder för ${area.name}`, error);
    }
  }

  await setLastAlertedNoticeIds(nextAlerted);
  return sentCount;
}

if (!TaskManager.isTaskDefined(BACKGROUND_WEATHER_TASK)) {
  TaskManager.defineTask(BACKGROUND_WEATHER_TASK, async () => {
    try {
      const sent = await checkAreasAndNotify();
      return sent > 0
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
      console.warn('V-dret: bakgrundskontroll misslyckades', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function registerBackgroundMonitoring(): Promise<void> {
  if (Platform.OS === 'web') return;
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
  if (registered) return;
  await BackgroundFetch.registerTaskAsync(BACKGROUND_WEATHER_TASK, {
    minimumInterval: 15 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundMonitoring(): Promise<void> {
  if (Platform.OS === 'web') return;
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEATHER_TASK);
  if (!registered) return;
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_WEATHER_TASK);
}
