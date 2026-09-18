import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getAreas, Area, getSettings, Settings, DEFAULT_SETTINGS } from '../../lib/storage';
import { useWeather } from '../../hooks/useWeather';
import { findFutureHours } from '../../lib/openMeteo';
import { WeatherCard } from '../../components/WeatherCard';
import { NoticeBadge } from '../../components/NoticeBadge';
import { HourlyStrip } from '../../components/HourlyStrip';
import { shareLocation } from '../../lib/share';
import { colors } from '../../constants/theme';

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [area, setArea] = useState<Area | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getAreas().then((areas) => setArea(areas.find((a) => a.id === id) ?? null));
    getSettings().then(setSettings);
  }, [id]);

  const { report, notices, loading, error, refresh } = useWeather(area?.latitude, area?.longitude, settings);

  if (!area) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <Text style={styles.name}>{area.name}</Text>
      <Text style={styles.coords}>
        {area.latitude.toFixed(3)}, {area.longitude.toFixed(3)}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {report && (
        <>
          <View style={styles.section}>
            <WeatherCard current={report.current} />
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

          <Pressable style={styles.shareButton} onPress={() => shareLocation(area)}>
            <Text style={styles.shareText}>Dela väder för {area.name}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  name: {
    color: colors.text,
    fontSize: 26,
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
  error: {
    color: colors.severe,
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareText: {
    color: colors.text,
    fontWeight: '700',
  },
});
