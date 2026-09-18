import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { findFutureHours } from '../../lib/openMeteo';
import { getCurrentDeviceLocation, DeviceLocation } from '../../lib/location';
import { WeatherCard } from '../../components/WeatherCard';
import { NoticeBadge } from '../../components/NoticeBadge';
import { HourlyStrip } from '../../components/HourlyStrip';
import { TemperatureChart } from '../../components/TemperatureChart';
import { DailyForecast } from '../../components/DailyForecast';
import { shareLocation } from '../../lib/share';
import { addArea, getSettings, Settings, DEFAULT_SETTINGS } from '../../lib/storage';
import { colors } from '../../constants/theme';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ lat?: string; lon?: string; name?: string }>();
  const sharedLat = params.lat ? Number(params.lat) : undefined;
  const sharedLon = params.lon ? Number(params.lon) : undefined;
  const isSharedView = sharedLat != null && sharedLon != null && !Number.isNaN(sharedLat) && !Number.isNaN(sharedLon);

  const [device, setDevice] = useState<DeviceLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const location = isSharedView
    ? { latitude: sharedLat!, longitude: sharedLon!, name: params.name || 'Delad plats' }
    : device;

  const loadDeviceLocation = useCallback(() => {
    setLocating(true);
    setLocationError(null);
    getCurrentDeviceLocation()
      .then(setDevice)
      .catch((err) => setLocationError(err instanceof Error ? err.message : 'Kunde inte hämta plats'))
      .finally(() => setLocating(false));
  }, []);

  useEffect(() => {
    if (!isSharedView) loadDeviceLocation();
  }, [isSharedView, loadDeviceLocation]);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const { report, notices, loading, error, refresh } = useWeather(
    location?.latitude,
    location?.longitude,
    settings
  );

  // Hämtar färsk väderdata varje gång man växlar tillbaka till fliken, så man
  // inte behöver dra manuellt för att uppdatera efter att appen legat still.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleShare = () => {
    if (!location) return;
    shareLocation(location);
  };

  const handleSaveArea = async () => {
    if (!location) return;
    await addArea({ name: location.name, latitude: location.latitude, longitude: location.longitude });
    Alert.alert('Sparad', `${location.name} har lagts till i dina bevakade områden.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        <Text style={styles.appTitle}>V-dret</Text>

        {isSharedView && (
          <View style={styles.sharedBanner}>
            <Text style={styles.sharedBannerText}>Du visar en delad plats</Text>
          </View>
        )}

        {!location && !locationError && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.helperText}>Hämtar din plats…</Text>
          </View>
        )}

        {locationError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{locationError}</Text>
            <Pressable style={styles.retryButton} onPress={loadDeviceLocation} disabled={locating}>
              <Text style={styles.retryText}>{locating ? 'Försöker igen…' : 'Försök igen'}</Text>
            </Pressable>
          </View>
        )}

        {location && (
          <>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.coords}>
              {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {report && (
              <>
                <View style={styles.section}>
                  <WeatherCard current={report.current} today={report.daily[0]} />
                </View>

                {notices.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Noteringar</Text>
                    {notices.map((n) => (
                      <NoticeBadge key={n.id} notice={n} />
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Kommande timmar</Text>
                  <HourlyStrip hours={findFutureHours(report.hourly, report.current.time, 12)} />
                </View>

                <View style={styles.section}>
                  <TemperatureChart hours={findFutureHours(report.hourly, report.current.time, 24)} />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>7 dagar</Text>
                  <DailyForecast days={report.daily} />
                </View>

                <View style={styles.buttonRow}>
                  <Pressable style={styles.actionButton} onPress={handleShare}>
                    <Text style={styles.actionText}>Dela väder</Text>
                  </Pressable>
                  {!isSharedView && (
                    <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={handleSaveArea}>
                      <Text style={styles.actionText}>Bevaka plats</Text>
                    </Pressable>
                  )}
                  {isSharedView && (
                    <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={handleSaveArea}>
                      <Text style={styles.actionText}>Spara denna plats</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}

            {loading && !report && (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} size="large" />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  appTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sharedBanner: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  sharedBannerText: {
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  coords: {
    color: colors.textMuted,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
  },
  actionText: {
    color: colors.text,
    fontWeight: '700',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  helperText: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.severe,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: colors.text,
    fontWeight: '600',
  },
});
