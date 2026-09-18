import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_SETTINGS, Settings, getSettings, saveSettings } from '../../lib/storage';
import {
  registerBackgroundMonitoring,
  requestNotificationPermissions,
  unregisterBackgroundMonitoring,
} from '../../lib/notifications';
import { colors, GUST_STEPS } from '../../constants/theme';

const QUIET_PRESETS = [
  { start: 22, end: 7, label: '22:00–07:00' },
  { start: 23, end: 6, label: '23:00–06:00' },
  { start: 21, end: 8, label: '21:00–08:00' },
  { start: 0, end: 6, label: '00:00–06:00' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const toggleBackgroundMonitoring = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Behörighet saknas', 'Tillåt aviseringar för att få varningar om åska och blåst.');
        return;
      }
      await registerBackgroundMonitoring();
    } else {
      await unregisterBackgroundMonitoring();
    }
    update({ backgroundMonitoring: value });
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Inställningar</Text>

        <Section title="Bevakning">
          <Row
            label="Bakgrundsbevakning"
            description="Kontrollera bevakade områden i bakgrunden och skicka aviseringar."
          >
            <Switch value={settings.backgroundMonitoring} onValueChange={toggleBackgroundMonitoring} />
          </Row>
          {Platform.OS !== 'web' && (
            <Text style={styles.hint}>
              Kräver en utvecklingsbygge (EAS build) för att fungera helt – i Expo Go kan bakgrundskontroller vara
              begränsade av operativsystemet.
            </Text>
          )}
        </Section>

        <Section title="Åska">
          <Row label="Åskvarningar" description="Visa noteringar och skicka aviseringar vid åska.">
            <Switch
              value={settings.thunderstormAlerts}
              onValueChange={(value) => update({ thunderstormAlerts: value })}
            />
          </Row>
        </Section>

        <Section title="Blåst">
          <Text style={styles.description}>Gräns för varning om kraftig vind (byar)</Text>
          <View style={styles.stepRow}>
            {GUST_STEPS.map((v) => (
              <Text
                key={v}
                onPress={() => update({ windGustWarning: v })}
                style={[styles.stepChip, settings.windGustWarning === v && styles.stepChipActive]}
              >
                {v} m/s
              </Text>
            ))}
          </View>
        </Section>

        <Section title="Tysta tider">
          <Row
            label="Dämpa notiser nattetid"
            description="Endast allvarliga varningar (t.ex. pågående åska) kommer igenom under tysta tider."
          >
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={(value) => update({ quietHours: { ...settings.quietHours, enabled: value } })}
            />
          </Row>
          {settings.quietHours.enabled && (
            <View style={styles.stepRow}>
              {QUIET_PRESETS.map((p) => {
                const active =
                  settings.quietHours.startHour === p.start && settings.quietHours.endHour === p.end;
                return (
                  <Text
                    key={p.label}
                    onPress={() =>
                      update({ quietHours: { ...settings.quietHours, startHour: p.start, endHour: p.end } })
                    }
                    style={[styles.stepChip, active && styles.stepChipActive]}
                  >
                    {p.label}
                  </Text>
                );
              })}
            </View>
          )}
        </Section>

        <Section title="Om data">
          <Text style={styles.hint}>
            Väderdata: Open-Meteo. Radar: RainViewer. Åska härleds från vädermodellens vädersymbol och
            instabilitetsindex (CAPE) – exakta blixtnedslag i realtid kräver en separat blixtdatakälla.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {children}
    </View>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  stepChipActive: {
    backgroundColor: colors.accent,
    color: colors.text,
    fontWeight: '700',
  },
});
