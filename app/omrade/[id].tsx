import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  getAreas,
  updateArea,
  Area,
  AreaType,
  AREA_TYPES,
  effectiveThresholds,
  getSettings,
  Settings,
  DEFAULT_SETTINGS,
} from '../../lib/storage';
import { useWeather } from '../../hooks/useWeather';
import { findFutureHours } from '../../lib/openMeteo';
import { WeatherCard } from '../../components/WeatherCard';
import { NoticeBadge } from '../../components/NoticeBadge';
import { HourlyStrip } from '../../components/HourlyStrip';
import { TemperatureChart } from '../../components/TemperatureChart';
import { DailyForecast } from '../../components/DailyForecast';
import { shareLocation } from '../../lib/share';
import { colors, GUST_STEPS } from '../../constants/theme';

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [area, setArea] = useState<Area | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const load = () => {
    getAreas().then((areas) => setArea(areas.find((a) => a.id === id) ?? null));
    getSettings().then(setSettings);
  };

  useEffect(load, [id]);

  const patchArea = (patch: Partial<Area>) => {
    setArea((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      updateArea(prev.id, patch);
      return next;
    });
  };

  const thresholds = area ? effectiveThresholds(settings, area) : settings;
  const { report, notices, loading, error, refresh } = useWeather(area?.latitude, area?.longitude, thresholds);

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platsinställningar</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Typ av plats</Text>
              <View style={styles.typeRow}>
                {AREA_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[styles.typeChip, area.type === t.value && styles.chipActive]}
                    onPress={() => patchArea({ type: t.value as AreaType })}
                  >
                    <Text style={styles.chipText}>
                      {t.emoji} {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.overrideRow}>
                <Text style={styles.settingsLabel}>Egna varningsinställningar för denna plats</Text>
                <Switch
                  value={!!area.alertOverrides}
                  onValueChange={(value) =>
                    patchArea({ alertOverrides: value ? { windGustWarning: settings.windGustWarning, thunderstormAlerts: settings.thunderstormAlerts } : undefined })
                  }
                />
              </View>

              {area.alertOverrides && (
                <>
                  <Text style={styles.settingsLabel}>Vindgräns för denna plats</Text>
                  <View style={styles.typeRow}>
                    {GUST_STEPS.map((v) => (
                      <Pressable
                        key={v}
                        style={[styles.typeChip, area.alertOverrides?.windGustWarning === v && styles.chipActive]}
                        onPress={() =>
                          patchArea({ alertOverrides: { ...area.alertOverrides, windGustWarning: v } })
                        }
                      >
                        <Text style={styles.chipText}>{v} m/s</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.overrideRow}>
                    <Text style={styles.settingsLabel}>Åskvarningar för denna plats</Text>
                    <Switch
                      value={area.alertOverrides?.thunderstormAlerts ?? true}
                      onValueChange={(value) =>
                        patchArea({ alertOverrides: { ...area.alertOverrides, thunderstormAlerts: value } })
                      }
                    />
                  </View>
                </>
              )}
            </View>
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
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  overrideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
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
