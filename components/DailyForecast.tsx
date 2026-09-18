import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DailyPoint } from '../lib/openMeteo';
import { describeWeatherCode } from '../lib/weatherCodes';
import { colors } from '../constants/theme';

function formatWeekday(dateStr: string, index: number): string {
  if (index === 0) return 'Idag';
  // Open-Meteo skickar rena datum ("2025-01-15"), som JS annars tolkar som UTC-midnatt
  // istället för lokal tid – lägg till en tid så den tolkas lokalt.
  const date = new Date(`${dateStr}T00:00:00`);
  const label = date.toLocaleDateString('sv-SE', { weekday: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

export function DailyForecast({ days }: { days: DailyPoint[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((d, i) => {
        const info = describeWeatherCode(d.weatherCode);
        return (
          <View key={d.date} style={[styles.item, info.isThunder && styles.thunderItem]}>
            <Text style={styles.day}>{formatWeekday(d.date, i)}</Text>
            <Text style={styles.emoji}>{info.emoji}</Text>
            <Text style={styles.tempMax}>{Math.round(d.temperatureMax)}°</Text>
            <Text style={styles.tempMin}>{Math.round(d.temperatureMin)}°</Text>
            {d.precipitationSum > 0 && <Text style={styles.precip}>{d.precipitationSum.toFixed(1)} mm</Text>}
            {d.windGustsMax >= 14 && <Text style={styles.wind}>{Math.round(d.windGustsMax)} m/s</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 72,
  },
  thunderItem: {
    borderColor: colors.severe,
  },
  day: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 22,
    marginVertical: 6,
  },
  tempMax: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  tempMin: {
    color: colors.textMuted,
    fontSize: 13,
  },
  precip: {
    color: colors.info,
    fontSize: 11,
    marginTop: 6,
  },
  wind: {
    color: colors.warning,
    fontSize: 11,
    marginTop: 2,
  },
});
